"use client"

import styles from "./styles.module.css"
import GuildSidebar from "@/components/guild-sidebar/guild-sidebar";
import { createContext, Dispatch, Fragment, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import MeSidebarContent from "@/components/sidebar/me-sidebar";
import { useCurrentUserStore } from "@/app/stores/current-user-store";

interface HomeLayoutProps {
    children: ReactNode
}

export default function HomeLayout({ children }: HomeLayoutProps) {
    const [isSettingOpen, setIsSettingOpen] = useState(false);

    useEffect(() => {
        // if (isSettingOpen) {
        //     setPrevTitle(document.title);
        //     document.title = "Discord | Settings";
        // }
        // else {
        //     document.title = prevTitle;
        // }
    }, [isSettingOpen])

    return (
        <Fragment>
            <div className={`${styles["guild-sidebar-container"]}`}>
                <GuildSidebar>
                    <MeSidebarContent />
                </GuildSidebar>
            </div>
            <div className={styles["content-container"]}>
                {children}
            </div>
        </Fragment>
    );
}