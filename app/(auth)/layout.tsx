import Image from "next/image";
import styles from "./styles.module.css"
import { ReactNode } from "react";

export default function AuthLayout({children}: {children: ReactNode}) {
    return (
        <div className={styles.page}>
            <Image
                src='/logo.svg'
                alt='Discord'
                width={0}
                height={0}
                className={styles.logo} />
            <div className={styles["content-wrapper"]}>
                {children}
            </div>
        </div>
    );
}