import { db } from "@/firebase";
import styles from "@/styles/GrabBucket.module.sass";
import { Box, Modal } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useState } from "react";

const GrabBucket = () => {
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();

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
            enqueueSnackbar(
                bucketId.length == 5 ? "Bucket did not exists!" : "Invalid bucket ID!",
                {
                    variant: "error",
                }
            );
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
