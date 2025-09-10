import { GuildSummary } from "@/interfaces/guild-summary";
import styles from "./styles.module.css"
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import Tooltip from "../tooltip/tooltip";
import { FaCirclePlus } from "react-icons/fa6";
import { FaCompass } from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import { useGuildsQuery } from "@/hooks/queries";
import { getImageURL } from "@/services/storage/storage.service";

const GuildIconContainer = styled.div`
    width: 72px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    position: relative;
    align-items: center;
    margin-bottom: 8px; 
`

const PillWrapper = styled.div`
    position: absolute;
    min-width: 8px;
    display: flex;
    align-items: center;
    left: 0;
    height: 100%;
`
const Pill = styled.div`
    width: 4px;
    background-color: white;
    height: 20px;
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
    transform: scale(0);
    transition: all 100ms ease-in;

    &.active {
        height: 40px;
        transform: scale(1);
    }

    &.hover {
        transform: scale(1);
    }
`

const IconContainer = styled.div`
    display: flex;
    width: 48px;
    height: 48px;
    border-radius: 24px;
    justify-content: center;
    background-color: var(--background-primary);
    align-items: center;
    transition: all 200ms;
    cursor: pointer;
    overflow: hidden;

    &:hover, &.active{
        border-radius: 16px;
        background-color: var(--primary);
    }
`

const GuildIconText = styled.p`
    font-weight: bold;
`

export function GuildIcon({ children, guild, onClick }: { children: ReactNode, guild: GuildSummary, onClick?: () => any }) {
    const pathName = usePathname();
    const router = useRouter();
    const [isHovering, setIsHovering] = useState(false);
    const targetPath = `/channels/${guild.id}`;

    function onMouseEnter() {
        setIsHovering(true);
    }

    function onMouseLeave() {
        setIsHovering(false);
    }

    return (
        <GuildIconContainer>
            <PillWrapper>
                <Pill className={`${isHovering ? 'hover' : ''} ${pathName.includes(targetPath) ? 'active' : ''}`} />
            </PillWrapper>
            <IconContainer
                className={`${pathName.includes(targetPath) ? 'active' : ''}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={() => {
                    if (onClick) {
                        onClick();
                    } else if (!pathName.includes(targetPath)) {
                        router.push(targetPath);
                    }
                }}>
                {children}
            </IconContainer>
            <Tooltip show={isHovering} text={guild.name} position="right" />
        </GuildIconContainer>
    )
}

function DMButton({ active }: { active: boolean }) {
    const pathName = usePathname();
    const router = useRouter();
    const [isHovering, setIsHovering] = useState(false);
    const targetPath = '/channels/me';

    function onMouseEnter() {
        setIsHovering(true);
    }

    function onMouseLeave() {
        setIsHovering(false);
    }

    return (
        <GuildIconContainer>
            <PillWrapper>
                <Pill className={`${isHovering ? 'hover' : ''} ${active ? 'active' : ''}`} />
            </PillWrapper>
            <IconContainer
                className={`${active ? 'active' : ''}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={(() => {
                    if (pathName.includes(targetPath)) return;
                    router.push(targetPath)
                })}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0.840821 3.3614 21.83 16.8" width={29} height={29}>
                    <path d="M 19.3354 4.7726 a 17.836 17.836 90 0 0 -4.508 -1.4112 c -0.2058 0.392 -0.392 0.784 -0.5684 1.1858 c -1.6562 -0.245 -3.332 -0.245 -4.998 0 c -0.1764 -0.4018 -0.3626 -0.8036 -0.5782 -1.176 c -1.568 0.2646 -3.0772 0.735 -4.508 1.4014 A 18.6592 18.6592 90 0 0 0.9408 17.346 a 18.0614 18.0614 90 0 0 5.5174 2.8126 c 0.4508 -0.6076 0.8428 -1.2544 1.176 -1.9404 c -0.637 -0.245 -1.2642 -0.539 -1.862 -0.9016 c 0.1666 -0.1176 0.3136 -0.2352 0.4606 -0.3626 c 3.5084 1.666 7.546 1.666 11.0544 0 l 0.4508 0.3626 c -0.588 0.3528 -1.225 0.6566 -1.862 0.9016 c 0.343 0.686 0.735 1.323 1.176 1.9404 c 1.9894 -0.6174 3.8612 -1.568 5.5272 -2.8126 c 0.4606 -4.7726 -0.7644 -8.9082 -3.234 -12.5734 Z M 8.134 14.8176 c -1.078 0 -1.96 -0.9996 -1.96 -2.2246 c 0 -1.2152 0.8624 -2.2148 1.96 -2.2148 s 1.9796 0.9996 1.96 2.2148 c 0 1.225 -0.8722 2.2246 -1.96 2.2246 Z m 7.252 0 c -1.078 0 -1.96 -0.9996 -1.96 -2.2246 c 0 -1.2152 0.8624 -2.2148 1.96 -2.2148 s 1.9796 0.9996 1.96 2.2148 c 0 1.225 -0.8624 2.2246 -1.96 2.2246 Z" fill="#dbdee1" />
                </svg>
            </IconContainer>
            <Tooltip show={isHovering} text={'Direct Messages'} position="right" />
        </GuildIconContainer>
    );
}

export default function GuildListSidebar({ isDM }: { isDM: boolean }) {
    const [showModal, setShowModal] = useState(false);
    const { data: guilds } = useGuildsQuery();
    return (
        <div className={styles["guild-list-container"]}>
            <DMButton active={isDM} />
            <div className={styles["horizontal-divider"]}></div>
            {guilds && guilds.map(guild => {
                const initials = guild.name.split(' ').map(s => s[0]).join(' ');
                return (
                    <GuildIcon key={guild.id} guild={guild}>
                        {guild.iconURL ?
                            <img
                                className="w-full h-full"
                                src={getImageURL(`icons/${guild.id}`, guild.iconURL)} alt="initials" />
                            :
                            <GuildIconText>{initials}sass</GuildIconText>
                        }
                    </GuildIcon>
                )
            })}
            <div className="">
                <GuildIcon guild={{ id: 'create', name: 'Add a server' }} onClick={() => { setShowModal(true) }}>
                    <FaCirclePlus size={20} />
                </GuildIcon>
                <GuildIcon guild={{ id: 'discovery', name: 'Discover' }}>
                    <FaCompass size={20} />
                </GuildIcon>
                <GuildIcon guild={{ id: 'download', name: 'Download app' }}>
                    <HiDownload size={20} />
                </GuildIcon>
            </div>
            {/* {showModal && <CreateGuildModal show={showModal} onClose={setShowModal} />} */}
        </div>
    );
}
