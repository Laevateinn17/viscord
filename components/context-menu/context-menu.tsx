import { useGuildsStore } from "@/app/stores/guilds-store";
import { useContextMenu } from "@/contexts/context-menu.context";
import { useModal } from "@/contexts/modal.context";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { ModalType } from "@/enums/modal-type.enum";
import { RelationshipType } from "@/enums/relationship-type.enum";
import { useDeleteRelationshipMutation } from "@/hooks/mutations";
import { useDMChannelsQuery } from "@/hooks/queries";
import { Guild } from "@/interfaces/guild";
import Relationship from "@/interfaces/relationship";
import { createDMChannel } from "@/services/channels/channels.service";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaAngleRight } from "react-icons/fa6";
import styled from "styled-components";


const ContextMenuContainer = styled.div`
    position: absolute;
    background-color: var(--background-surface-higher);
    padding: 8px;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    box-shadow: var(--shadow-high);
    min-width: 188px;
    user-select: none;
`

const ListItem = styled.div`
    padding: 8px;
    border-radius: 2px;
    cursor: pointer;
    font-size: 14px;
    line-height: 18px;

    &:hover {
        background-color: var(--background-mod-subtle);
        
        svg {
            color: white;
        }
    }
    svg {
        color: var(--text-muted);
        
    }
`

const Separator = styled.div`
    border-bottom: 1px solid var(--border-subtle);
    margin: 8px;
`

function UserContextMenu({ relationship }: { relationship: Relationship }) {
    const { guilds } = useGuildsStore();
    const [showGuilds, setShowGuilds] = useState(false);
    const { mutate: removeFriend } = useDeleteRelationshipMutation();
    const { data: channels } = useDMChannelsQuery();
    const { hideMenu } = useContextMenu();
    const router = useRouter();

    return (
        <Fragment>
            <div className="">
                <ListItem>Profile</ListItem>
                <ListItem onClick={async () => {
                    const channel = channels?.find(ch => ch.recipients[0].id == relationship.user.id);
                    if (!channel) {
                        await createDMChannel(relationship.user.id);
                    }
                    router.push(`/channels/me/${channel!.id}`);
                }}>Message</ListItem>
                <ListItem>Call</ListItem>
            </div>
            <Separator />
            <div className="">
                <div className="" onMouseEnter={() => setShowGuilds(true)} onMouseLeave={() => setShowGuilds(false)}>
                    <ListItem className="flex items-center justify-between relative">
                        <p>Invite to Server</p>
                        <FaAngleRight className="" size={14} />
                        {showGuilds && guilds && (
                            <ContextMenuContainer className="absolute left-full">
                                {Array.from(guilds.values()).map(guild => {
                                    return <ListItem key={guild.id}>{guild.name}</ListItem>
                                })}
                            </ContextMenuContainer>
                        )}
                    </ListItem>
                </div>
                {relationship.type === RelationshipType.Friends && <ListItem onClick={() => { removeFriend(relationship); hideMenu(); }}>Remove Friend</ListItem>}
                {relationship.type === RelationshipType.PendingReceived && <ListItem onClick={() => { removeFriend(relationship); hideMenu(); }}>Accept Friend</ListItem>}
                {relationship.type !== RelationshipType.Blocked && <ListItem onClick={() => { removeFriend(relationship); hideMenu(); }}>Add Friend</ListItem>}
                <ListItem>Ignore</ListItem>
                <ListItem className="text-[var(--text-danger)] hover:bg-[var(--">Block</ListItem>
            </div>
        </Fragment>
    )
}

function GuildSidebarContextMenu({ guild }: { guild: Guild }) {
    const { openModal } = useModal();
    const { hideMenu } = useContextMenu();


    return (
        <Fragment>
            <ListItem
                onClick={() => {
                    openModal(ModalType.CREATE_CHANNEL, { guildId: guild.id });
                    hideMenu();
                }}>Create Channel</ListItem>
            <ListItem
                onClick={() => {
                    openModal(ModalType.CREATE_CATEGORY, { guildId: guild.id });
                    hideMenu();
                }}>Create Category</ListItem>
            <ListItem>Invite People</ListItem>
        </Fragment>
    )
}

export default function ContextMenu() {
    const { menuState, hideMenu } = useContextMenu();
    const menuRef = useRef<HTMLDivElement>(null!);
    const [position, setPosition] = useState({ x: menuState?.x, y: menuState?.y });

    useLayoutEffect(() => {
        if (!menuRef.current || !menuState?.visible) return;

        const menu = menuRef.current;
        const { innerWidth, innerHeight } = window;
        const rect = menu.getBoundingClientRect();

        let newX = menuState.x;
        let newY = menuState.y;

        if (newX + rect.width > innerWidth) {
            newX = innerWidth - rect.width - 20;
        }

        if (newY + rect.height > innerHeight) {
            newY = innerHeight - rect.height - 20;
        }

        setPosition({ x: newX, y: newY });
    }, [menuState]);

    useEffect(() => {
        const handleClickOutside = (evt: MouseEvent) => {
            if (menuState?.visible && menuRef.current && !menuRef.current.contains(evt.target as Node)) {
                hideMenu();
            }
        };

        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [menuState]);

    if (!menuState?.visible) {
        return null;
    }

    return (
        <ContextMenuContainer className="absolute" style={{ top: position.y, left: position.x }} ref={menuRef}>
            {menuState.type === ContextMenuType.USER && <UserContextMenu relationship={menuState.data} />}
            {menuState.type === ContextMenuType.GUILD_SIDEBAR && <GuildSidebarContextMenu guild={menuState.data} />}
        </ContextMenuContainer>
    );
}