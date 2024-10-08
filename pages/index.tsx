import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.sass";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import Header from "@/components/Header";
import Table from "@/components/Table";
import GrabBucket from "@/components/GrabBucket";
import Footer from "@/components/Footer";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
    return (
        <>
            <Head>
                <title>Hastebucket</title>
            </Head>
            <main className={styles.container}>
                <GrabBucket />
                <Table />
            </main>
            <Footer />
        </>
    );
}
