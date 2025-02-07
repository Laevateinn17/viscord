import { ReactNode } from "react";
import styles from "./styles.module.css"
import { FaCheck } from "react-icons/fa";
interface CheckboxProps {
    children: ReactNode;
    value: boolean;
    onChange: (val: boolean) => void
}

export default function Checkbox({ children, value, onChange }: CheckboxProps) {

    return (
        <div className={styles['container']}>
            <div className={`${styles["checkbox"]} ${value ? styles["checkbox-checked"] : ""}`} onClick={() => onChange(!value)}>
            {value && <span className={styles["checkbox-icon"]}><FaCheck size={11}/></span>}
            </div>
            {children}
        </div>
    );
}