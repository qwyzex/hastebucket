import styles from "@/styles/Footer.module.sass";
import { Box, Button, IconButton, Modal } from "@mui/material";
import HelpIcon from "@mui/icons-material/Help";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { useState } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import GitHubIcon from "@mui/icons-material/GitHub";
import Image from "next/image";
import CloseIcon from "@mui/icons-material/Close";

const Footer = () => {
    const [openHelpModal, setOpenHelpModal] = useState<boolean>(false);
    const handleOpenHelpModal = () => setOpenHelpModal(true);
    const handleCloseHelpModal = () => setOpenHelpModal(false);

    return (
        <footer className={styles.container}>
            <p>&#169; 2024 Hastebucket. All rights reserved.</p>

            <InfoModal
                open={openHelpModal}
                handleOpen={handleOpenHelpModal}
                handleClose={handleCloseHelpModal}
            />
        </footer>
    );
};

const InfoModal = ({ open, handleOpen, handleClose }: any) => {
    const style = {
        position: "absolute" as "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: 500,
        minWidth: 350,
        bgcolor: "var(--background)",
        border: "3px solid var(--acc)",
        borderRadius: 2,
        boxShadow: 12,
        p: 4,
    };

    return (
        <>
            <div className={styles.helpButton}>
                <IconButton className="btn-" onClick={handleOpen}>
                    <QuestionMarkIcon />
                </IconButton>
            </div>
            <Modal open={open} onClose={handleClose}>
                <Box sx={style} className={styles.modalBox}>
                    <article>
                        <header>
                            <h2>Hastebucket</h2>
                            <IconButton onClick={handleClose}>
                                <CloseIcon />
                            </IconButton>
                        </header>
                        {/* <hr></hr> */}
                        <p>
                            Hastebucket is a platform for quickly sharing information,
                            files, documents, and texts accross the internet safely and
                            neatly without the need for Login using external accounts
                            which is sometimes frustrating.
                        </p>
                        <p>
                            It is developed by{" "}
                            <a
                                target="_blank"
                                href="https://instagram.com/ifaa.sh
                            "
                            >
                                @qwyzex
                            </a>{" "}
                            using NextJS and Firebase. It uses a secure secret Token
                            validation system which makes the files and texts shared safe.
                        </p>
                        <hr></hr>
                        <div>
                            <p>
                                <a
                                    href="https://github.com/qwyzex/hastebucket"
                                    target="_blank"
                                >
                                    <Image
                                        src="/github.png"
                                        height={15}
                                        width={15}
                                        alt=""
                                    />
                                    Github Page
                                    <OpenInNewIcon fontSize="small" />
                                </a>
                            </p>
                            <p>
                                <a
                                    href="https://github.com/qwyzex/organiptyc"
                                    target="_blank"
                                >
                                    <Image
                                        src="/organiptyc.png"
                                        height={15}
                                        width={15}
                                        alt=""
                                    />
                                    Checkout my app, Organiptyc!
                                    <OpenInNewIcon fontSize="small" />
                                </a>
                            </p>
                        </div>
                    </article>
                </Box>
            </Modal>{" "}
        </>
    );
};

export default Footer;
