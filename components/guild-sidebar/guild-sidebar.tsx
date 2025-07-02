import { ReactNode } from "react"
import styles from "./styles.module.css"

interface HomeLayoutProps {
    children: ReactNode
}
export default function GuildSidebar({ children }: HomeLayoutProps) {
    return (
        <div className={styles["container"]}>
            {children}
        </div>
    );
}