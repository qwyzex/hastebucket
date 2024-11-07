import Link from "next/link"
import styles from "@/styles/404.module.sass";
import {NextPage} from "next";

const Page404: NextPage = () => {

   return (
       <main className={styles.container}>
           <h1>404 :o</h1>

           <Link href="/">Let&apos;s Go Home</Link>
       </main>
   )
};

export default Page404;