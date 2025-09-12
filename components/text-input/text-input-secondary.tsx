"use client"
import { ReactNode, useEffect, useRef, useState } from "react";
import styles from './styles.module.css'
import styled from "styled-components";

export interface TextInputProps {
    type?: "text" | "password" | "number"
    value: string
    errorMessage?: string | null
    placeholder?: string
    leftElement?: ReactNode
    rightElement?: ReactNode
    onChange: (val: string) => any
}

const Container = styled.div`
    width: 100%;
    background-color: var(--input-background);
    border: 1px solid var(--input-border);
    font-size: 16px;
    border-radius: 8px;

    min-width: 0;
    display: flex;
    align-items: center;

    &.focus {
        outline: 1px solid var(--input-focused);
    }
`
export default function TextInputSecondary({ leftElement, rightElement, type = "text", placeholder, value, onChange }: TextInputProps) {
    const [focus, setFocus] = useState(false);
    const helperTextContainerRef = useRef<HTMLDivElement>(null!);
    const [maxHeight, setMaxHeight] = useState("0px");

    useEffect(() => {
        if (helperTextContainerRef.current) {
            const scrollHeight = helperTextContainerRef.current.scrollHeight;
            setMaxHeight(focus ? `${scrollHeight}px` : "0px");
        }
    }, [focus])

    return (
        <Container className={`${focus ? 'focus' : ''}`} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}>
            {leftElement}
            <input className={`${styles['input-transparent']}`} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
            {rightElement}
        </Container>
    );
}