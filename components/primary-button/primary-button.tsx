"use client"
import { ReactNode, useEffect, useState } from "react"
import styles from "./styles.module.css"
import Tooltip from "../tooltip/tooltip"
import styled from "styled-components"
import { LoadingIndicator } from "../loading-indicator/loading-indicator"

interface PrimaryButtonProps {
    children: ReactNode
    onClick?: () => any
    isLoading?: boolean
    tooltip?: string
    tooltipPosition?: "top" | "bottom" | "left" | "right"
    tooltipSize?: string
    className?: string
    disabled?: boolean
}

const Button = styled.button`
    display: flex;
    background-color: var(--button-primary);
    border: 1px solid transparent;
    padding: 4px 12px;
    line-height: 20px;
    border-radius: 8px;
    font-weight: 500;
    flex-grow: 1;

    &.hover {
        background-color: var(--button-primary-hover);
    }

    &.active {
        background-color: var(--button-primary-selected);
        color: var(--text-brand);
    }

    &.disabled {
        // background-color: var(--button-primary-disabled);
        opacity: 0.5;
        cursor: not-allowed;
    }

`

export default function PrimaryButton({ className, children, onClick, isLoading, disabled, tooltipPosition, tooltip, tooltipSize }: PrimaryButtonProps) {
    const [isHovering, setIsHovering] = useState(false);
    
    return (
        <Button className={`${className} ${isHovering ? "hover" : ""} ${disabled || isLoading ? "disabled" : ""}`}
            onClick={isLoading !== true ? onClick : undefined}
            disabled={disabled || isLoading === true}
            onMouseEnter={() => {if (!disabled) setIsHovering(true)}}
            onMouseLeave={() => {if (!disabled) setIsHovering(false)}}>
            {tooltip &&
                <Tooltip position={tooltipPosition!} show={isHovering} text={tooltip} fontSize={tooltipSize} />}
            {isLoading === true ?
                // <div className={styles["loading-wrapper"]}>
                //     <div className={styles["dot-flashing"]}></div>
                // </div>
                <LoadingIndicator/>
                :
                children}
        </Button>
    );
}