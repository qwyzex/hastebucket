import { useState, DragEvent, ChangeEvent } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, db } from "@/firebase";
import styles from "@/styles/Table.module.sass";
import createUniqueBucketId from "@/functions/generateBucketId";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/router";

const Table = () => {
    const router = useRouter();

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [shareMode, setShareMode] = useState<"file" | "text">("file");
    const [textInput, setTextInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDragEnter = () => setIsDragging(true);
    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) setSelectedFiles(files);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (shareMode === "file" && selectedFiles.length === 0) return;
        setLoading(true);

        const bucketid = await createUniqueBucketId();
        const ownerToken = uuidv4();
        localStorage.setItem(`bucket_${bucketid}_token`, ownerToken);

        if (shareMode === "file") {
            const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
            const lastTransferred: Record<string, number> = {};
            let totalTransferred = 0;

            const fileMetadata: { name: string; size: number; downloadURL: string }[] =
                [];

            for (const file of selectedFiles) {
                const fileRef = ref(storage, `buckets/${bucketid}/${file.name}`);
                const uploadTask = uploadBytesResumable(fileRef, file);
                lastTransferred[file.name] = 0;

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const current = snapshot.bytesTransferred;
                            const delta = current - lastTransferred[file.name];
                            lastTransferred[file.name] = current;

                            totalTransferred += delta;
                            setUploadProgress((totalTransferred / totalSize) * 100);
                        },
                        (error) => reject(error),
                        async () => {
                            const downloadURL = await getDownloadURL(
                                uploadTask.snapshot.ref
                            );
                            fileMetadata.push({
                                name: file.name,
                                size: file.size,
                                downloadURL,
                            });
                            resolve();
                        }
                    );
                });
            }

            await setDoc(doc(db, `buckets/${bucketid}`), {
                createdAt: new Date(),
                id: bucketid,
                type: "file_upload",
                files: fileMetadata,
                ownerToken,
            });

            router.push(`/bucket/${bucketid}`);
            setLoading(false);
        } else {
            await setDoc(doc(db, `buckets/${bucketid}`), {
                createdAt: new Date(),
                id: bucketid,
                type: "text_share",
                text: textInput || "",
                ownerToken,
            });
            router.push(`/bucket/${bucketid}`);
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <p>Create a new bucket</p>

            <div
                className={`${styles.toggleContainer} ${shareMode === "file" ? styles.left : styles.right
                    } ${loading ? styles.disabled : ""}`}
            >
                <span
                    className={shareMode === "file" ? styles.active : ""}
                    onClick={() => !loading && setShareMode("file")}
                >
                    <h3>File</h3>
                </span>
                <span
                    className={shareMode === "text" ? styles.active : ""}
                    onClick={() => !loading && setShareMode("text")}
                >
                    <h3>Text</h3>
                </span>
            </div>

            {shareMode === "file" && (
                <div
                    className={`${styles.dropArea} ${isDragging ? styles.dragging : ""}`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <p>Drag & Drop files here or click to select</p>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        disabled={loading}
                    />
                </div>
            )}

            {shareMode === "text" && (
                <textarea
                    className={styles.textArea}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter your text here"
                />
            )}

            <div className={styles.progressContainer}>
                {selectedFiles.length > 0 && shareMode === "file" && (
                    <>
                        <p>Selected Files:</p>
                        <ul>
                            {selectedFiles.map((file, i) => (
                                <li key={i}>
                                    (
                                    {file.size / 1024 > 1000
                                        ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
                                        : (file.size / 1024).toFixed(1) + " KB"}
                                    ) {file.name}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {uploadProgress !== null && (
                    <div className={styles.progress}>
                        Upload progress: {uploadProgress.toFixed(2)}%
                    </div>
                )}
            </div>

            <button
                className={styles.createBucket}
                onClick={handleUpload}
                disabled={
                    loading ||
                    (shareMode === "file" && selectedFiles.length === 0) ||
                    (shareMode === "text" && !textInput.trim())
                }
            >
                <p>Create Bucket</p>
            </button>
        </div>
    );
};

export default Table;
