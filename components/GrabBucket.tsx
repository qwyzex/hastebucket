import { db } from "@/firebase";
import styles from "@/styles/GrabBucket.module.sass";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { useState } from "react";

const GrabBucket = () => {
    const router = useRouter();

    const [bucketId, setBucketId] = useState<string>("");

    const handleBucketIdFormChange = (e: any) => {
        e.preventDefault();

        setBucketId(e.target.value);
    };

    const handleGrabbingBucket = async (e: any) => {
        e.preventDefault();

        const docRef = doc(db, "buckets", bucketId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            router.push(`/bucket/${bucketId}`);
        } else {
            alert("Bucket not found!");
            setBucketId("");
            return;
        }
    };

    return (
        <section className={styles.container}>
            <p>Directly access available bucket by entering their bucket id!</p>
            <form onSubmit={handleGrabbingBucket}>
                <input
                    type="text"
                    value={bucketId}
                    onChange={handleBucketIdFormChange}
                    placeholder="Enter Bucket ID"
                    maxLength={5}
                />
                <input disabled={!bucketId.trim()} type="submit" value="GRAB" />
            </form>
        </section>
    );
};

export default GrabBucket;
