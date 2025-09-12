import { ReactNode } from "react";
import styles from "./styles.module.css"

export default function SidebarContentContainer({ children,  }: { children: ReactNode }) {
    return (
        <div className={styles["content-container"]}>
            {children}
        </div>
    );
}