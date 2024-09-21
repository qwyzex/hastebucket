import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase"; // Your Firestore setup

const generateBucketId = (length = 5) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const checkBucketIdExists = async (bucketId: string) => {
    const docRef = doc(db, "buckets/", bucketId);
    const docSnap = await getDoc(docRef);

    return docSnap.exists(); // Returns true if the bucketId already exists
};

const createUniqueBucketId = async () => {
    let bucketId;
    let exists = true;

    // Keep generating new bucketId until we find one that doesn't exist
    while (exists) {
        bucketId = generateBucketId();
        exists = await checkBucketIdExists(bucketId);
    }

    // // Now we know this bucketId is unique, store it in Firestore
    // await setDoc(doc(db, `buckets/${bucketId}`), {
    //     createdAt: new Date(),
    //     id: bucketId,
    // });

    return bucketId;
};

export default createUniqueBucketId;
