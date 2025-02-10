import { ReactNode, useState } from "react"
import styles from "./styles.module.css"
import Tooltip from "../tooltip/tooltip"

interface PrimaryButtonProps {
    children: ReactNode
    onClick?: () => any
    isLoading?: boolean
    tooltip?: string
    tooltipPosition?: "top" | "bottom" | "left" | "right"
    tooltipSize?: string
}

export default function PrimaryButton({ children, onClick, isLoading, tooltipPosition, tooltip, tooltipSize}: PrimaryButtonProps) {
    const [isHovering, setIsHovering] = useState(false);


    return (
        <button className={styles.button}
        onClick={isLoading !== true ? onClick : undefined}
        disabled={isLoading === true}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}>
            {tooltip &&
                <Tooltip position={tooltipPosition!} show={isHovering} text={tooltip} fontSize={tooltipSize}/>}
            {isLoading === true ?
                <div className={styles["loading-wrapper"]}>
                    <div className={styles["dot-flashing"]}></div>
                </div>
                :
                children}
        </button>
    );
}