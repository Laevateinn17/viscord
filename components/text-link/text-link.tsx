import Link from "next/link"
import styles from "./styles.module.css"
export interface TextLinkProps {
    text: string
    href: string
    fontSize?: number
}

export default function TextLink({text, href, fontSize=14}: TextLinkProps) {
    return (
        <Link href={href} className={styles.text} style={{fontSize: fontSize}}>{text}</Link>
    );
}