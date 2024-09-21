import styles from "@/styles/Header.module.sass";
import HBIcon from "./HBIcon";

const Header = () => {
    return (
        <header className={styles.container}>
            <div>
                <HBIcon />
            </div>
            <h1>HASTEBUCKET</h1>
        </header>
    );
};

export default Header;
