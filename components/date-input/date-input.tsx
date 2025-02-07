"use client"
import { useState } from "react";
import Dropdown from "../dropdown/dropdown";
import styles from './styles.module.css'

export interface DateInputProps {
    label: string;
    isRequired?: boolean
}

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);

const years = [...Array(150).keys()].map((i) => (new Date().getFullYear()) - i - 3);

export default function DateInput({ label, isRequired = false }: DateInputProps) {
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [year, setYear] = useState("");

    return (
        <div className={styles.container}>
            <div className={styles['label-container']}>
                <p className="font-bold whitespace-break-spaces leading-[1.25]">{label.toUpperCase() + ' '}</p>
                {isRequired && <span className="text-red-400">*</span>}
            </div>
            <div className={styles["input-wrapper"]}>
                <Dropdown placeholder="Month" values={months} value={month} onChange={(val) => setMonth(val)}/>
                <Dropdown placeholder="Day" values={days} value={day} onChange={(val) => setDay(val)}/>
                <Dropdown placeholder="Year" values={years} value={year} onChange={(val) => setYear(val)}/>
            </div>
        </div>
    );
}

