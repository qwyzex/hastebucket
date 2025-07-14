import { useEffect, useRef, useState } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject, getBlob } from "firebase/storage";
import { db, storage } from "@/firebase";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "@/styles/BucketPage.module.sass";
import { Box, Button, Modal, Snackbar, SnackbarCloseReason } from "@mui/material";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useSnackbar } from "notistack";
import Loading from "@/components/Loading";
import {
    CopyAll,
    FileDownload,
    FolderShared,
    IosShare,
    Launch,
    QrCode,
    QrCode2,
    Share,
    ShareRounded,
    Shortcut,
} from "@mui/icons-material";

import { QRCodeCanvas } from "qrcode.react";

const BucketPage = () => {
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const { bucketid } = router.query;

    const [isOwner, setIsOwner] = useState(false);
    const [bucketExists, setBucketExists] = useState<boolean | null>(null);
    const [bucketData, setBucketData] = useState<any>(null);

    const [openQR, setOpenQR] = useState(false);

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

    const handleDownloadFile = async (file: any) => {
        try {
            const fileRef = ref(storage, `buckets/${bucketid}/${file.name}`);
            const blob = await getBlob(fileRef);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", file.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading file:", error);
        }
    };

    const handleDownloadAllAsZip = async () => {
        if (!bucketData?.files || !Array.isArray(bucketData.files)) return;

        const zip = new JSZip();

        try {
            for (const file of bucketData.files) {
                const fileRef = ref(storage, `buckets/${bucketid}/${file.name}`);
                const blob = await getBlob(fileRef);
                zip.file(file.name, blob); // Add each blob to the ZIP file
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `bucket-${bucketid}.zip`);
        } catch (error) {
            console.error("Failed to create zip:", error);
        }
    };

    // const handleDownloadFile = async () => {
    //     const fileRef = ref(storage, `buckets/${bucketid}/${bucketData.filename}`);

    //     try {
    //         const blob = await getBlob(fileRef);
    //         const url = window.URL.createObjectURL(blob);
    //         const link = document.createElement("a");
    //         link.href = url;
    //         link.setAttribute("download", bucketData.filename);
    //         document.body.appendChild(link);
    //         link.click();
    //         link.remove();
    //         window.URL.revokeObjectURL(url); // Clean up
    //     } catch (error) {
    //         console.error("Error fetching download URL:", error);
    //     }
    // };

    const handleSuccessCopy = () => {
        enqueueSnackbar("Copied to clipboard!!", { variant: "success" });
    };

    const [openDeleteBucketModal, setOpenDeleteBucketModal] = useState<boolean>(false);
    const handleOpenDeleteBucketModal = () => setOpenDeleteBucketModal(true);
    const handleCloseDeleteBucketModal = () => setOpenDeleteBucketModal(false);

    // SHARE OPTIONS LOGIC
    const handleNativeShare = async () => {
        if (!navigator.share) {
            enqueueSnackbar("Sharing not supported on this device.", {
                variant: "warning",
            });
            return;
        }

        try {
            await navigator.share({
                title: "Check out this bucket on Hastebucket",
                url: window.location.href,
            });
        } catch (err) {
            console.error("Share failed:", err);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            enqueueSnackbar("Bucket link copied to clipboard!", { variant: "success" });
        } catch (err) {
            console.error("Failed to copy:", err);
            enqueueSnackbar("Failed to copy link", { variant: "error" });
        }
    };

    const handleShowQR = () => setOpenQR(true);
    const handleCloseQR = () => setOpenQR(false);

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
                                <div className={styles.shareOptions}>
                                    <button
                                        className={styles.shareButton}
                                        onClick={handleNativeShare}
                                    >
                                        <ShareRounded />
                                        <h4>SHARE</h4>
                                    </button>
                                    <button
                                        className={styles.shareButton}
                                        onClick={handleCopyLink}
                                    >
                                        <CopyAll />
                                        <h4>COPY URL</h4>
                                    </button>
                                    <QRCode
                                        open={openQR}
                                        handleOpen={handleShowQR}
                                        handleClose={handleCloseQR}
                                    />
                                </div>
                                <div>
                                    <p>
                                        Date Created :{" "}
                                        {bucketData.createdAt.toDate().toLocaleString()}
                                    </p>
                                    {bucketData.type == "file_upload" && (
                                        <p>
                                            Total File Size :{" "}
                                            {(() => {
                                                const totalSize =
                                                    bucketData.files?.reduce(
                                                        (acc: any, f: any) =>
                                                            acc + f.size,
                                                        0
                                                    ) || 0;
                                                return totalSize / 1024 > 1000
                                                    ? (totalSize / (1024 * 1024)).toFixed(
                                                        2
                                                    ) + " MB"
                                                    : (totalSize / 1024).toFixed(2) +
                                                    " KB";
                                            })()}
                                        </p>
                                    )}
                                </div>
                                <hr />
                                <div className={styles.contentFrame}>
                                    <p>Content :</p>
                                    {bucketData.type == "file_upload" ? (
                                        <div className={styles.contentTable}>
                                            {bucketData.files?.map(
                                                (file: any, idx: number) => (
                                                    <>
                                                        <div
                                                            key={idx}
                                                            className={styles.fileItem}
                                                        >
                                                            <a
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <Launch />
                                                            </a>
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                value={file.name}
                                                            />
                                                            <button
                                                                onClick={() =>
                                                                    handleDownloadFile(
                                                                        file
                                                                    )
                                                                }
                                                            >
                                                                <FileDownload />
                                                            </button>
                                                        </div>
                                                    </>
                                                )
                                            )}
                                            {bucketData.files.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            bucketData.files?.forEach(
                                                                (
                                                                    file: any,
                                                                    idx: number
                                                                ) => {
                                                                    handleDownloadFile(
                                                                        file
                                                                    );
                                                                }
                                                            )
                                                        }
                                                    >
                                                        Download All Individual Files
                                                    </button>
                                                    <button
                                                        onClick={handleDownloadAllAsZip}
                                                    >
                                                        Download All As .ZIP
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

export default BucketPage;

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

    const yesButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (open && yesButtonRef.current) {
            yesButtonRef.current.focus();
        }
    }, [open]);

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
            if (bucketData.type === "file_upload" && bucketData.files) {
                for (const file of bucketData.files) {
                    const fileRef = ref(storage, `buckets/${bucketid}/${file.name}`);
                    try {
                        await deleteObject(fileRef);
                    } catch (err) {
                        console.warn(`Failed to delete ${file.name}:`, err);
                    }
                }
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
                            autoFocus
                            ref={yesButtonRef}
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

const QRCode = ({ open, handleOpen, handleClose }: any) => {
    return (
        <>
            <button className={styles.shareButton} onClick={handleOpen}>
                <QrCode />
                <h4>QR Code</h4>
            </button>
            <Modal open={open} onClose={handleClose}>
                <Box
                    className={`${styles.modalBox} ${styles.QRModal}`}
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "var(--background)",
                        border: "3px solid var(--acc)",
                        borderRadius: 2,
                        boxShadow: 12,
                        p: 4,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                    }}
                >
                    <h4>Scan this QR code to access the bucket:</h4>
                    <QRCodeCanvas value={window.location.href} size={200} />
                    <Button className={styles.shareButton} onClick={handleClose}>
                        Close
                    </Button>
                </Box>
            </Modal>
        </>
    );
};
