import styles from "./styles.module.css"

interface TooltipProps {
    text: string
    show: boolean
    fontSize?: string
    position: "top" | "bottom" | "right" | "left"
}

export default function Tooltip({text, show: isHovering, fontSize="16px", position}: TooltipProps) {
        return (
        <div className={`${styles["tooltip-container"]} ${isHovering ? styles["tooltip-container-active"] : ""}  ${styles[position]} shadow-xl`}>
            <p style={{fontSize: fontSize}}>
                {text}
            </p>
        </div>
    );
}