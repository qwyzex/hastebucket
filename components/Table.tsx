import { useState, DragEvent, ChangeEvent } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, db } from "@/firebase";
import styles from "@/styles/Table.module.sass";
import createUniqueBucketId from "@/functions/generateBucketId";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid"; // To generate a unique token
import { useRouter } from "next/router";

const Table = () => {
    const router = useRouter();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [shareMode, setShareMode] = useState<"file" | "text">("file"); // Toggle between file and text
    const [textInput, setTextInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDragEnter = () => {
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            setSelectedFile(files[0]);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile && shareMode === "file") return;
        setLoading(true);

        const bucketid = await createUniqueBucketId();
        const ownerToken = uuidv4(); // Generate a unique owner token

        // Store the token in localStorage
        localStorage.setItem(`bucket_${bucketid}_token`, ownerToken);

        // Proceed with file upload if in file mode
        if (shareMode === "file" && selectedFile) {
            const storageRef = ref(storage, `buckets/${bucketid}/${selectedFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, selectedFile);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload failed", error);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                        console.log("File available at", downloadURL);
                        setUploadProgress(null);
                        setSelectedFile(null); // Clear the file after upload

                        await setDoc(doc(db, `buckets/${bucketid}`), {
                            createdAt: new Date(),
                            id: bucketid,
                            type: shareMode === "file" ? "file_upload" : "text_share",
                            filename: selectedFile.name,
                            size: selectedFile.size,
                            fileDownloadURL: downloadURL,
                            ownerToken, // Save the owner token in Firestore
                        });

                        // Redirect to the bucket management page
                        router.push(`/bucket/${bucketid}`);
                        setLoading(false);
                    });
                }
            );
        } else {
            await setDoc(doc(db, `buckets/${bucketid}`), {
                createdAt: new Date(),
                id: bucketid,
                type: shareMode === "file" ? "file_upload" : "text_share",
                text: textInput || "",
                ownerToken, // Save the owner token in Firestore
            });
            // If text, directly redirect to bucket management page
            router.push(`/bucket/${bucketid}`);
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <p>Create a new bucket</p>
            <div
                className={`${styles.toggleContainer} ${
                    shareMode == "file" ? styles.left : styles.right
                } ${loading ? styles.disabled : ""}`}
            >
                <span
                    className={shareMode == "file" ? styles.active : ""}
                    onClick={() => !loading && setShareMode("file")}
                >
                    <h3>File</h3>
                </span>
                <span
                    className={shareMode == "text" ? styles.active : ""}
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
                    <p>Drag & Drop your files here or click to select</p>
                    <input type="file" onChange={handleFileChange} disabled={loading} />
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

            <div>
                {selectedFile && shareMode === "file" && (
                    <p>Selected file: {selectedFile.name}</p>
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
                    loading
                        ? true
                        : shareMode === "file"
                        ? !selectedFile
                        : !textInput.trim()
                }
            >
                <p>{loading ? "LOADING" : "CHILL"} Create Bucket</p>
            </button>
        </div>
    );
};

export default Table;
