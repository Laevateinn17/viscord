import { ReactNode } from "react";
import styles from "./styles.module.css"
import { FaCheck } from "react-icons/fa";
interface CheckboxProps {
    children?: ReactNode;
    value: boolean;
    onChange: (val: boolean) => void
}

export default function Checkbox({ children, value, onChange }: CheckboxProps) {

    return (
        <div className={styles['container']} onClick={() => onChange(!value)}>
            <div className={`${styles["checkbox"]} ${value ? styles["checkbox-checked"] : ""}`}>
            {value && <span className={styles["checkbox-icon"]}><FaCheck size={11}/></span>}
            </div>
            {children}
        </div>
    );
}