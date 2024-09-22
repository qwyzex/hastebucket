import { useEffect, useState } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject, getBlob } from "firebase/storage";
import { db, storage } from "@/firebase";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "@/styles/BucketPage.module.sass";
import { Box, Button, Modal, Snackbar, SnackbarCloseReason } from "@mui/material";
import { useSnackbar } from "notistack";
import Loading from "@/components/Loading";

const BucketPage = () => {
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
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

    const handleDownloadFile = async () => {
        console.log(1);
        const fileRef = ref(storage, `buckets/${bucketid}/${bucketData.filename}`);

        try {
            console.log(2);
            const blob = await getBlob(fileRef);
            console.log(3);
            const url = window.URL.createObjectURL(blob);
            console.log(4);
            const link = document.createElement("a");
            console.log(5);
            link.href = url;
            console.log(6);
            link.setAttribute("download", bucketData.filename);
            console.log(7);
            document.body.appendChild(link);
            console.log(8);
            link.click();
            console.log(9);
            link.remove();
            console.log(0);
            window.URL.revokeObjectURL(url); // Clean up
        } catch (error) {
            console.error("Error fetching download URL:", error);
        }
    };

    const handleSuccessCopy = () => {
        enqueueSnackbar("Copied to clipboard!!", { variant: "success" });
    };

    const [openDeleteBucketModal, setOpenDeleteBucketModal] = useState<boolean>(false);
    const handleOpenDeleteBucketModal = () => setOpenDeleteBucketModal(true);
    const handleCloseDeleteBucketModal = () => setOpenDeleteBucketModal(false);

    return (
        <>
            <Head>
                <title>{bucketid} - Hastebucket</title>
            </Head>
            <main className={styles.container}>
                {bucketExists === null ? (
                    <Loading />
                ) : !bucketExists ? (
                    <p>
                        Bucket not found. It may have been deleted or the ID is invalid.
                    </p>
                ) : (
                    bucketExists && (
                        <>
                            <section className="fadeIn">
                                <h1>Bucket ({bucketid})</h1>
                                <div>
                                    <p>
                                        Date Created :{" "}
                                        {bucketData.createdAt.toDate().toLocaleString()}
                                    </p>
                                    {bucketData.type == "file_upload" && (
                                        <p>
                                            File Size :{" "}
                                            {(bucketData.size / 1024 > 1000
                                                ? bucketData.size / (1024 * 1024)
                                                : bucketData.size / 1024
                                            ).toFixed(2)}{" "}
                                            {bucketData.size / 1024 > 1000 ? "MB" : "KB"}
                                        </p>
                                    )}
                                </div>
                                <hr />
                                <div className={styles.contentFrame}>
                                    <p>Content :</p>
                                    {bucketData.type == "file_upload" ? (
                                        <div className={styles.contentTable}>
                                            {bucketData?.filename && (
                                                <>
                                                    <a href={bucketData.fileDownloadURL}>
                                                        {bucketData.filename}
                                                    </a>
                                                    <button onClick={handleDownloadFile}>
                                                        Download File
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={styles.contentTable}>
                                            <p>{bucketData.text}</p>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        bucketData.text
                                                    );
                                                    handleSuccessCopy();
                                                }}
                                            >
                                                Copy Text
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isOwner ? (
                                    <div>
                                        <p>You are the owner of this bucket.</p>
                                        <DeleteConfirmation
                                            open={openDeleteBucketModal}
                                            handleOpen={handleOpenDeleteBucketModal}
                                            handleClose={handleCloseDeleteBucketModal}
                                            isOwner={isOwner}
                                            bucketid={bucketid}
                                            bucketData={bucketData}
                                        />
                                    </div>
                                ) : (
                                    <p>
                                        You do not have permission to manage this bucket.
                                    </p>
                                )}
                            </section>
                        </>
                    )
                )}
            </main>
        </>
    );
};

const DeleteConfirmation = ({
    open,
    handleOpen,
    handleClose,
    isOwner,
    bucketid,
    bucketData,
}: any) => {
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();

    const style = {
        position: "absolute" as "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 500,
        bgcolor: "var(--background)",
        border: "3px solid var(--acc)",
        borderRadius: 2,
        boxShadow: 12,
        p: 4,
    };

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

            enqueueSnackbar("Bucket destroyed successfully!", { variant: "success" });
            router.push("/"); // Redirect to the homepage after deletion
        } catch (error) {
            console.error("Error deleting bucket:", error);
        }
    };

    return (
        <>
            <button className={"btn-dgr"} onClick={handleOpen}>
                Destroy Bucket
            </button>
            <Modal open={open} onClose={handleClose}>
                <Box sx={style} className={styles.modalBox}>
                    <p>
                        Are you sure you want to destroy this bucket ({bucketid})
                        manually?
                    </p>
                    <div>
                        <Button
                            className={`${styles.deleteButton} btn-dgr`}
                            onClick={handleDeleteBucket}
                        >
                            Yes
                        </Button>
                        <Button className={styles.deleteButton} onClick={handleClose}>
                            No
                        </Button>
                    </div>
                </Box>
            </Modal>{" "}
        </>
    );
};

export default BucketPage;
