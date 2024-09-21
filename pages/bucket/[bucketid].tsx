import { useEffect, useState } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject, getBlob } from "firebase/storage";
import { db, storage } from "@/firebase";
import { useRouter } from "next/router";
import Head from "next/head";

const BucketPage = () => {
    const router = useRouter();
    const { bucketid } = router.query;
    const [isOwner, setIsOwner] = useState(false);
    const [bucketExists, setBucketExists] = useState<boolean | null>(null);
    const [bucketData, setBucketData] = useState<any>(null);

    useEffect(() => {
        const checkBucketExists = async () => {
            if (!bucketid) return;

            // Fetch the bucket document
            const bucketDocRef = doc(db, "buckets", bucketid as string);
            const bucketDoc = await getDoc(bucketDocRef);

            if (!bucketDoc.exists()) {
                setBucketExists(false);
                return;
            }

            setBucketExists(true);
            const data = bucketDoc.data();
            setBucketData(data);

            // Check ownership if the bucket exists
            const storedToken = localStorage.getItem(`bucket_${bucketid}_token`);
            if (data.ownerToken === storedToken) {
                setIsOwner(true); // Set as owner if tokens match
            }
        };

        checkBucketExists();
    }, [bucketid]);

    const handleDeleteBucket = async () => {
        if (!isOwner || !bucketid || !bucketData) return;

        try {
            // Delete the Firestore document
            await deleteDoc(doc(db, "buckets", bucketid as string));

            // If it's a file bucket, delete the file from Firebase Storage
            if (bucketData.type === "file_upload") {
                const fileRef = ref(
                    storage,
                    `buckets/${bucketid}/${bucketData.filename}`
                );
                await deleteObject(fileRef);
            }

            alert("Bucket deleted successfully!");
            router.push("/"); // Redirect to the homepage after deletion
        } catch (error) {
            console.error("Error deleting bucket:", error);
        }
    };

    const handleDownloadFile = async () => {
        const fileRef = ref(storage, `buckets/${bucketid}/${bucketData.filename}`);

        try {
            const blob = await getBlob(fileRef);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", bucketData.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Clean up
        } catch (error) {
            console.error("Error fetching download URL:", error);
        }
    };

    if (bucketExists === null) return <p>Loading...</p>;

    if (!bucketExists)
        return <p>Bucket not found. It may have been deleted or the ID is invalid.</p>;

    return (
        <>
            <Head>
                <title>{bucketid} - Hastebucket</title>
            </Head>
            <div>
                <h1>Bucket Management ({bucketid})</h1>
                {bucketData.type == "file_upload" ? (
                    <>
                        {bucketData?.filename && (
                            <div>
                                <p>File: {bucketData.filename}</p>
                                <button onClick={handleDownloadFile}>
                                    Download File
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    bucketData.text
                )}

                {isOwner ? (
                    <div>
                        <p>You are the owner of this bucket.</p>
                        <button onClick={handleDeleteBucket}>Delete Bucket</button>
                    </div>
                ) : (
                    <p>You do not have permission to manage this bucket.</p>
                )}
            </div>
        </>
    );
};

export default BucketPage;
