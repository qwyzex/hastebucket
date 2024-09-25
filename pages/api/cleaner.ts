import type { NextApiRequest, NextApiResponse } from "next";
import { db, storage } from "@/firebase"; // Ensure you have Firebase initialized
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

// Define the Firestore collection path
const BUCKETS_COLLECTION = "buckets";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Get the current time and subtract 24 hours (in milliseconds)
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Query the Firestore 'buckets' collection for documents older than 24 hours
        const bucketsRef = collection(db, BUCKETS_COLLECTION);
        const oldBucketsQuery = query(
            bucketsRef,
            where("createdAt", "<", twentyFourHoursAgo)
        );
        const querySnapshot = await getDocs(oldBucketsQuery);

        // Array to hold promises for deleting documents and files
        const deletePromises: Promise<void>[] = [];

        querySnapshot.forEach((bucketDoc) => {
            const bucketData = bucketDoc.data();
            const bucketId = bucketDoc.id;

            // Delete the document from Firestore
            const deleteDocPromise = deleteDoc(
                doc(db, `${BUCKETS_COLLECTION}/${bucketId}`)
            );
            deletePromises.push(deleteDocPromise);

            // If there are files associated with the bucket, delete them from Firebase Storage
            if (bucketData.filename) {
                const fileRef = ref(
                    storage,
                    `buckets/${bucketId}/${bucketData.filename}`
                );
                const deleteFilePromise = deleteObject(fileRef);
                deletePromises.push(deleteFilePromise);
            }
        });

        // Wait for all delete operations to complete
        await Promise.all(deletePromises);

        res.status(200).json({ message: "Old buckets cleaned successfully" });
    } catch (err) {
        console.error("Error cleaning old buckets:", err);
        res.status(500).json({ message: "Failed to clean old buckets", error: err });
    }
}
