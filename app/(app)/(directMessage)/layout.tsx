"use client"

import styles from "./styles.module.css"
import GuildSidebar from "@/components/guild-sidebar/guild-sidebar";
import { createContext, Dispatch, Fragment, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import { useCurrentUserQuery, useRelationshipsQuery } from "@/hooks/queries";
import MeSidebarContent from "@/components/sidebar/me-sidebar";

interface HomeLayoutProps {
    children: ReactNode
}

export default function HomeLayout({ children }: HomeLayoutProps) {
    const { data: user } = useCurrentUserQuery();
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    // const [prevTitle, setPrevTitle] = useState(document.title);
    const { data: relationships } = useRelationshipsQuery();
    useEffect(() => {
        if (user) {
            setIsLoading(false);
        }
        else {
            setIsLoading(true);
        }
    }, [user])


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