import { useState, DragEvent, ChangeEvent } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, db } from "@/firebase";
import styles from "@/styles/Table.module.sass";
import createUniqueBucketId from "@/functions/generateBucketId";
import { doc, setDoc } from "firebase/firestore";

const Table = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [shareMode, setShareMode] = useState<"file" | "text">("file"); // Toggle between file and text
    const [textInput, setTextInput] = useState<string>("");

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
        const bucketid = await createUniqueBucketId();

        if (shareMode === "file" && selectedFile) {
            // Handle file upload
            await setDoc(doc(db, `buckets/${bucketid}`), {
                createdAt: new Date(),
                id: bucketid,
                type: "file_upload",
                size: selectedFile.size || 0,
                text: "",
            });

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
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        console.log("File available at", downloadURL);
                        setUploadProgress(null);
                        setSelectedFile(null); // Clear the file after upload
                    });
                }
            );
        } else if (shareMode === "text" && textInput.trim()) {
            // Handle text sharing
            await setDoc(doc(db, `buckets/${bucketid}`), {
                createdAt: new Date(),
                id: bucketid,
                type: "text_share",
                text: textInput,
            });

            console.log("Text shared successfully!");
            setTextInput(""); // Clear text after submission
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.toggleContainer}>
                <label>
                    <input
                        type="radio"
                        name="shareMode"
                        value="file"
                        checked={shareMode === "file"}
                        onChange={() => setShareMode("file")}
                    />
                    File Sharing
                </label>
                <label>
                    <input
                        type="radio"
                        name="shareMode"
                        value="text"
                        checked={shareMode === "text"}
                        onChange={() => setShareMode("text")}
                    />
                    Text Sharing
                </label>
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
                    <input type="file" onChange={handleFileChange} />
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

            {selectedFile && shareMode === "file" && (
                <p>Selected file: {selectedFile.name}</p>
            )}

            {uploadProgress !== null && (
                <div className={styles.progress}>
                    Upload progress: {uploadProgress.toFixed(2)}%
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={shareMode === "file" ? !selectedFile : !textInput.trim()}
            >
                {shareMode === "file" ? "Upload File" : "Share Text"}
            </button>
        </div>
    );
};

export default Table;
