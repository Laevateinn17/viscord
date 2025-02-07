import styles from "./styles.module.css"

interface PrimaryButtonProps {
    text: string
    onClick?: () => any
}

export default function PrimaryButton({text, onClick}: PrimaryButtonProps) {
    return (
        <button className={styles.button} onClick={onClick}>
            {text}
        </button>
    );
}