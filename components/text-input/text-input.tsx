"use client"
import { useState } from "react";
import styles from './styles.module.css'

export interface TextInputProps {
    label: string;
    type?: "text" | "password" | "number";
    isRequired?: boolean;
    helper?: string;
    value: string;
    errorMessage?: string | null;

    onChange: (val: string) => any
}

export default function TextInput({ label, type = "text", isRequired = false, helper, value, onChange, errorMessage}: TextInputProps) {
    const [focus, setFocus] = useState(false)
    return (
        <div className={styles.container}>
            <div className={styles['label-container']}>
                <p className={`font-bold tracking-wide whitespace-break-spaces leading-[1.333] ${errorMessage ? "text-red-400" : ""}`}>{label.toUpperCase() + ' '}</p>
                {!errorMessage && isRequired && <span className="text-red-400">*</span>}
                {errorMessage && <p className="tracking-wide text-red-400 leading-[1.333] italic">{` - ${errorMessage}`}</p>}
            </div>
            <div className="" onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}>
                <input className={styles['input']} type={type} value={value} onChange={(e) => onChange(e.target.value)}/>
            </div>
            {helper &&
                <div className={`${styles["text-helper"]} ${focus && styles["text-helper-active"]}`}>
                    <p>{helper}</p>
                </div>}
        </div>
    );
}