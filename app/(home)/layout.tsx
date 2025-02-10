"use client"

import styles from "./styles.module.css"
import GuildSidebar from "@/components/guild-sidebar/guild-sidebar";
import { Fragment, ReactNode, useEffect, useState } from "react";
import UserArea from "@/components/user-area/user-area";
import GuildListSidebar from "@/components/guild-list-sidebar/guild-list-sidebar";
import { getCurrentUserData } from "@/services/users/users.service";
import { useAuth } from "@/contexts/auth.context";
import SettingsPage from "@/components/settings-page/settings-page";

interface HomeLayoutProps {
    headerContent: ReactNode
    sidebarContent: ReactNode
    children: ReactNode
}

export default function HomeLayout({ headerContent, sidebarContent, children }: HomeLayoutProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    useEffect(() => {
        if (user) {
            setIsLoading(false);
        }
    }, [user])



    return (
        <div className={styles["page"]}>
            {isLoading ?
                <p>Loading...</p>
                :
                <Fragment>
                    <div className={`${styles["main-content"]} ${isSettingOpen ? styles["main-content-hidden"] : ""}`}>
                        <GuildListSidebar />
                        <div className={`${styles["guild-sidebar-container"]} ${styles} `}>
                            <GuildSidebar headerContent={headerContent} sidebarContent={sidebarContent} />
                            <UserArea user={user!} openSettingsHandler={() => setIsSettingOpen(true)} />
                        </div>
                //maincontent
                    </div>
                    <SettingsPage show={isSettingOpen} closeSettingsHandler={() => setIsSettingOpen(false)} />
                </Fragment>
            }
        </div>
    );
}
