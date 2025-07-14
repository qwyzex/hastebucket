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
        if (shareMode === "text" && !textInput.trim()) return;

        setLoading(true);
        const bucketId = await createUniqueBucketId();
        const ownerToken = uuidv4();
        localStorage.setItem(`bucket_${bucketId}_token`, ownerToken);

        if (shareMode === "text") {
            await setDoc(doc(db, `buckets/${bucketId}`), {
                createdAt: new Date(),
                id: bucketId,
                type: "text_share",
                text: textInput.trim(),
                ownerToken,
            });
            router.push(`/bucket/${bucketId}`);
            return;
        }

        // Calculate total bytes across all files
        const totalBytes = selectedFiles.reduce((acc, file) => acc + file.size, 0);
        let totalBytesTransferred = 0;

        const fileMetas: any[] = [];

        for (const file of selectedFiles) {
            const storageRef = ref(storage, `buckets/${bucketId}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            await new Promise<void>((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        // New bytes uploaded for this chunk
                        const currentTransferred = snapshot.bytesTransferred;
                        const previousTransferred =
                            (snapshot as any)._previousBytesTransferred || 0;

                        // Update totalBytesTransferred
                        totalBytesTransferred += currentTransferred - previousTransferred;
                        (snapshot as any)._previousBytesTransferred = currentTransferred;

                        const overallProgress =
                            (totalBytesTransferred / totalBytes) * 100;
                        setUploadProgress(overallProgress);
                    },
                    (error) => {
                        console.error("Upload failed", file.name, error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        fileMetas.push({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            url: downloadURL,
                        });
                        resolve();
                    }
                );
            });
        }

        await setDoc(doc(db, `buckets/${bucketId}`), {
            createdAt: new Date(),
            id: bucketId,
            type: "file_upload",
            files: fileMetas,
            ownerToken,
        });

        setSelectedFiles([]);
        setUploadProgress(null);
        router.push(`/bucket/${bucketId}`);
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
                                    {file.name} ({Math.round(file.size / 1024)} KB)
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
