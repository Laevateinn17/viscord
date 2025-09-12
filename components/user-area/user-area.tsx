import styles from "./styles.module.css"
import { UserData } from "@/interfaces/user-data";
import { UserStatus, UserStatusString } from "@/enums/user-status.enum";
import { MdCircle, MdDoNotDisturbOn, MdOutlineCircle } from "react-icons/md";
import { BsMicFill, BsMicMuteFill } from "react-icons/bs";
import { LuHeadphoneOff, LuHeadphones } from "react-icons/lu";
import { FaGear } from "react-icons/fa6";
import TransparentButton from "../transparent-button/transparent-button";
import { useEffect, useRef, useState } from "react";
import { PiMoonFill } from "react-icons/pi";
import UserAvatar from "../user-avatar/user-avatar";
import { FaCircle } from "react-icons/fa";
import { CurrentUserProfileCard } from "../user-profile-card/user-profile-card";
import Modal from "../modals/modal";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useCurrentUserQuery } from "@/hooks/queries";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useAppSettingsStore } from "@/app/stores/app-settings-store";

interface UserAreaProps {
    openSettingsHandler: () => any
}
export default function UserArea({ openSettingsHandler }: UserAreaProps) {
    const { user } = useCurrentUserStore();
    const [isHovering, setIsHovering] = useState(false);
    const [showProfileCard, setShowProfileCard] = useState(false);
    const profileCardRef = useRef<HTMLDivElement>(null!)
    const { getUserProfile } = useUserProfileStore();
    const { mediaSettings, setMuted, setDeafened } = useAppSettingsStore();

    useEffect(() => {
        function handleOutsideClick(e: MouseEvent) {
            if (showProfileCard && profileCardRef.current && !profileCardRef.current.contains(e.target as Node)) {
                setShowProfileCard(false);
            }
        }

        document.addEventListener("click", handleOutsideClick);

        return () => {
            document.removeEventListener("click", handleOutsideClick);
        }
    }, [showProfileCard])


    if (!user) {
        return <div></div>;
    }

    return (
        <div className={styles["container"]} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <div className={styles["user-info-container"]} onClick={() => setShowProfileCard(true)}>
                <UserAvatar user={user.profile} showStatus={true} />
                <div className={styles["user-identifier-wrapper"]}>
                    <p className={styles["display-name-text"]}>{user!.profile.displayName}</p>
                    <div className={styles["subtext"]}>
                        <p className={`${styles["status-text"]} ${styles["subtext"]} ${(isHovering || showProfileCard) && styles["status-text-hover"]}`}>{UserStatusString[user!.profile.status]}</p>
                        <p className={`${styles["username-text"]} ${styles["subtext"]} ${(isHovering || showProfileCard) && styles["username-text-hover"]}`}>{user!.profile.username}</p>

                    </div>
                </div>
            </div>
            <div className={styles["setting-wrapper"]}>
                <TransparentButton
                    tooltipSize="14px"
                    tooltip={mediaSettings.isMuted || mediaSettings.isDeafened ? "Turn On Microphone" : "Turn Off Microphone"}
                    tooltipPosition="top"
                    onClick={() => setMuted(!mediaSettings.isMuted)}
                >
                    <div className={`${styles["icon-container"]} ${mediaSettings.isMuted || mediaSettings.isDeafened ? 'text-[var(--text-danger)]' : ''}`}>
                       {mediaSettings.isMuted || mediaSettings.isDeafened ? <BsMicMuteFill size={18}/> : <BsMicFill size={18} />}
                    </div>
                </TransparentButton>
                <TransparentButton
                    tooltipSize="14px"
                    tooltip={mediaSettings.isDeafened ? "Undeafen" : "Deafen"}
                    tooltipPosition="top"
                    onClick={() => setDeafened(!mediaSettings.isDeafened)}
                >
                    <div className={`${styles["icon-container"]} ${mediaSettings.isDeafened ? 'text-[var(--text-danger)]' : ''}`}>
                        {mediaSettings.isDeafened ? <LuHeadphoneOff size={18}/> : <LuHeadphones size={18} />}
                    </div>
                </TransparentButton>
                <TransparentButton
                    onClick={openSettingsHandler}
                    tooltipSize="14px"
                    tooltip="User Settings"
                    tooltipPosition="top">
                    <div className={styles["icon-container"]}>
                        <FaGear size={18} />
                    </div>
                </TransparentButton>
            </div>
            {showProfileCard &&
                <div className="absolute bottom-full z-50" ref={profileCardRef}>
                    <CurrentUserProfileCard user={user.profile} />
                </div>
            }
        </div>
    );
}