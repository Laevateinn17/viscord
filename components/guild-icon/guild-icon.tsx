"use client"
import { GuildSummary } from "@/interfaces/guild-summary"
import { ReactNode, useEffect, useRef, useState } from "react"
import styles from "./styles.module.css"
import { usePathname, useRouter } from "next/navigation"
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime"
import Tooltip from "../tooltip/tooltip"

interface GuildIconProps {
    children?: ReactNode
    guildData: GuildSummary
}

export default function GuildIcon({ children, guildData }: GuildIconProps) {
    const pillRef = useRef<HTMLDivElement>(null!);
    const iconRef = useRef<HTMLDivElement>(null!);
    const tooltipRef = useRef<HTMLDivElement>(null!);
    const pathName = usePathname();
    
    const [isHovering, setIsHovering] = useState(false);
    
    useEffect(() => {
        if (pathName === `/channels/${guildData.id}`) {
            pillRef.current.classList.add(styles["pill-active"]);
            iconRef.current.classList.add(styles["icon-container-active"]);
        }
    }, [pathName])

    function onMouseEnter() {
        pillRef.current.classList.add(styles["pill-hover"]);
        setIsHovering(true);
    }

    function onMouseLeave() {
        pillRef.current.classList.remove(styles["pill-hover"]);
        setIsHovering(false);
    }

    return (
        <div className={styles["item-container"]}>
            <div className={styles["pill-wrapper"]}>
                <div className={styles["pill"]} ref={pillRef}></div>
            </div>
            <div className={styles["icon-container"]} ref={iconRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {children}
            </div>
            <Tooltip show={isHovering} text={guildData.name} position="right"/>
            {/* <div className={`${styles["tooltip-container"]} shadow-xl`} ref={tooltipRef}>
                {guildData.name}
            </div> */}
        </div>
    )
}