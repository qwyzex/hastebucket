import styles from "@/styles/GrabBucket.module.sass";

const GrabBucket = () => {
    const handleGrabbingBucket = (e: any) => {
        e.preventDefault();
    };

    return (
        <section className={styles.container}>
            <p>Directly access available bucket by entering their bucket id!</p>
            <form onSubmit={handleGrabbingBucket}>
                <input type="text" name="" id="" placeholder="Enter Bucket ID" />
                <input type="submit" value="GRAB" />
            </form>
        </section>
    );
};

export default GrabBucket;
