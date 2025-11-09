import { ReactNode } from "react"
import styles from "./styles.module.css"

export default function SidebarHeader({children}: {children: ReactNode}) {
    return (
        <div className={`${styles["header-container"]} shadow-md`}>
            {children}
        </div>
    )
}