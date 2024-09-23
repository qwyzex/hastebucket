import styles from "@/styles/Header.module.sass";
import HBIcon from "./HBIcon";
import { useRouter } from "next/router";

const Header = () => {
    const router = useRouter();

    const handleReturnHome = () => {
        router.push("/");
    };

    return (
        <header className={styles.container}>
            <div onClick={handleReturnHome}>
                <HBIcon className={styles.icon} />
            </div>
            <h1 onClick={handleReturnHome}>HASTEBUCKET</h1>
        </header>
    );
};

export default Header;
