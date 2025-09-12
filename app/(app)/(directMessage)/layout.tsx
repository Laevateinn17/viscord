"use client"

import styles from "./styles.module.css"
import { createContext, Dispatch, Fragment, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import MeSidebarContent from "@/components/sidebar/me-sidebar";
import styled from "styled-components";

interface HomeLayoutProps {
    children: ReactNode
}

const SidebarContainer = styled.div`
    width: 304px;
    display: flex;
    flex-direction: column;
    flex: 1;
`

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
                <SidebarContainer>
                    <MeSidebarContent />
                </SidebarContainer>
            </div>
            <div className={styles["content-container"]}>
                {children}
            </div>
        </Fragment>
    );
}