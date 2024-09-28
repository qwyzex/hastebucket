import type { NextApiRequest, NextApiResponse } from "next";
import { db, storage } from "@/firebase"; // Ensure you have Firebase initialized
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

const BUCKETS_COLLECTION = "buckets";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const bucketsRef = collection(db, BUCKETS_COLLECTION);
        const oldBucketsQuery = query(
            bucketsRef,
            where("createdAt", "<", twentyFourHoursAgo)
        );
        const querySnapshot = await getDocs(oldBucketsQuery);

        const deletePromises: Promise<void>[] = [];

        querySnapshot.forEach((bucketDoc) => {
            const bucketData = bucketDoc.data();
            const bucketId = bucketDoc.id;

            // Document deletion
            const deleteDocPromise = deleteDoc(
                doc(db, `${BUCKETS_COLLECTION}/${bucketId}`)
            );
            deletePromises.push(deleteDocPromise);

            // File deletion (if applicable)
            if (bucketData.filename) {
                const fileRef = ref(
                    storage,
                    `buckets/${bucketId}/${bucketData.filename}`
                );
                const deleteFilePromise = deleteObject(fileRef);
                deletePromises.push(deleteFilePromise);
            }
        });

        await Promise.all(deletePromises);

        res.status(200).json({ message: "Old buckets cleaned successfully" });
    } catch (err) {
        console.error("Error cleaning old buckets:", err);
        res.status(500).json({ message: "Failed to clean old buckets", error: err });
    }
}
