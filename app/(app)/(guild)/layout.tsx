"use client"

import SidebarContentContainer from "@/components/guild-sidebar/sidebar-content-container";
import SidebarHeader from "@/components/guild-sidebar/sidebar-header";
import { ChannelType } from "@/enums/channel-type.enum";
import { useGuildDetailQuery, useRelationshipsQuery } from "@/hooks/queries";
import { Channel } from "@/interfaces/channel";
import { useParams, useRouter } from "next/navigation";
import { Fragment, ReactNode, useEffect, useState } from "react";
import { FaAngleDown } from "react-icons/fa6";
import styled from "styled-components";
import { Router } from "next/router";
import { ChannelCategory } from "./channel-category";
import styles from "./styles.module.css"
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import ChannelButton from "./channel-button";
import { useContextMenu } from "@/contexts/context-menu.context";
import { ContextMenuType } from "@/enums/context-menu-type.enum";

const HeaderContainer = styled.div`
    padding: 12px 8px 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    cursor: pointer;

    transition: background-color 100ms linear;

    &:hover {
        background-color: var(--background-modifier-hover);
    }
`

const HeaderText = styled.p`
    color: var(--text-default);
    line-height: 1.25;
    font-weight: 600;
    text-overflow: ellipsis;
`

const MoreButton = styled.div`
    padding: 6px;
    color: var(--icon-tertiary);
`

const SidebarContainer = styled.div`
    width: 304px;
    display: flex;
    flex-direction: column;
    flex: 1;
`

export default function Page({ children }: { children: ReactNode }) {
    const { guildId } = useParams();
    const { isPending, data: guild, isError } = useGuildDetailQuery(guildId ? guildId.toString() : '');
    const [categories, setCategories] = useState<Channel[]>([]);
    const router = useRouter();
    const { user } = useCurrentUserStore();
    const { showMenu } = useContextMenu();
    // const [prevTitle, setPrevTitle] = useState(document.title);
    useEffect(() => {
        if (!guild) return;

        setCategories(guild.channels.filter(ch => ch.type === ChannelType.Category));
    }, [guild])

    useEffect(() => {
        if (isError) {
            router.push('/channels/me')
        }
    }, [isError])


    return (
        <Fragment>
            <div className={`${styles["guild-sidebar-container"]}`}>
                <SidebarContainer onContextMenu={(e) => showMenu(e, ContextMenuType.GUILD_SIDEBAR, guild)} >
                    <SidebarHeader>
                        <HeaderContainer>
                            <HeaderText>{guild?.name}</HeaderText>
                            <MoreButton>
                                <FaAngleDown />
                            </MoreButton>
                        </HeaderContainer>
                    </SidebarHeader>
                    <SidebarContentContainer>
                        <div className="py-[8px]">
                            {guild?.channels.filter(ch => !ch.parent && ch.type !== ChannelType.Category).map(ch => {
                                return (
                                    <div className="mt-[8px] px-[8px]" key={ch.id}>
                                        <ChannelButton collapse={false} channel={{ ...ch, guild: guild }} />
                                    </div>
                                );
                            })}
                            {categories.sort((a, b) => a.createdAt > b.createdAt ? 1 : a.createdAt === b.createdAt ? 0 : -1).map(cat => {
                                return <div className="px-[8px]" key={cat.id}>
                                    <ChannelCategory channel={{ ...cat, guild: guild }} children={guild ? guild.channels.filter(ch => ch.parent && ch.parent.id === cat.id) : []}></ChannelCategory>
                                </div>
                            })}
                        </div>
                    </SidebarContentContainer>
                </SidebarContainer>
            </div>
            <div className={styles["content-container"]}>
                {children}
            </div>
        </Fragment>
    );
}