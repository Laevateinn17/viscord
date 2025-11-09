import styles from "./styles.module.css"

interface TooltipProps {
    text: string
    show: boolean
    fontSize?: string
    position: "top" | "bottom" | "right" | "left"
    className?: string
}

export default function Tooltip({text, show: isHovering, fontSize="16px", position, className}: TooltipProps) {
        return (
        <div className={`bg-black ${styles["tooltip-container"]} ${isHovering ? styles["tooltip-container-active"] : ""}  ${styles[position]} shadow-xl ${className}`}>
            <p style={{fontSize: fontSize}}>
                {text}
            </p>
        </div>
    );
}