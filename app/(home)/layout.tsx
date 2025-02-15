"use client"

import styles from "./styles.module.css"
import GuildSidebar from "@/components/guild-sidebar/guild-sidebar";
import { createContext, Dispatch, Fragment, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import UserArea from "@/components/user-area/user-area";
import GuildListSidebar from "@/components/guild-list-sidebar/guild-list-sidebar";
import { useAuth } from "@/contexts/auth.context";
import SettingsPage from "@/components/settings-page/settings-page";
import { isSet } from "util/types";

interface HomeLayoutProps {
    headerContent: ReactNode
    sidebarContent: ReactNode;
    children: ReactNode
}

interface ContentContextType {
    setContent: Dispatch<SetStateAction<ReactNode>>
}

const ContentContext = createContext<ContentContextType>(null!)

export function useContentContext() {
    return useContext(ContentContext);
}

export default function HomeLayout({ headerContent, sidebarContent, children }: HomeLayoutProps) {
    const { user, getUser, setUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const [content, setContent] = useState<ReactNode>(<div></div>);
    const [prevTitle, setPrevTitle] = useState(document.title);

    useEffect(() => {
        if (user) {
            setIsLoading(false);
        }
        else {
            setIsLoading(true);
        }
    }, [user])

    useEffect(() => {
        if (isSettingOpen) {
            setPrevTitle(document.title);
            document.title = "Discord | Settings";
        }
        else {
            document.title = prevTitle;
        }
    }, [isSettingOpen])

    return (
        <div className={styles["page"]}>
            {isLoading ?
                // <p>Loading...</p>
                <p></p>
                :
                <Fragment>
                    <div className={`${styles["main-content"]} ${isSettingOpen ? styles["main-content-hidden"] : ""}`}>
                        <GuildListSidebar />
                        <ContentContext.Provider value={{setContent}}>
                            <div className={`${styles["guild-sidebar-container"]} ${styles} `}>
                                <GuildSidebar headerContent={headerContent} sidebarContent={sidebarContent} />
                                <UserArea user={user!} openSettingsHandler={() => setIsSettingOpen(true)} />
                            </div>
                        </ContentContext.Provider>
                        <div className="content-container">
                            {content}
                        </div>
                    </div>
                    <SettingsPage show={isSettingOpen} closeSettingsHandler={() => setIsSettingOpen(false)} />
                </Fragment>
            }
        </div>
    );
}
