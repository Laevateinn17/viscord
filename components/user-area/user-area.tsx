import styles from "./styles.module.css"
import { UserData } from "@/interfaces/user-data";
import { UserStatus, UserStatusString } from "@/enums/user-status.enum";
import { MdCircle, MdDoNotDisturbOn, MdOutlineCircle } from "react-icons/md";
import { BsMicFill } from "react-icons/bs";
import { LuHeadphones } from "react-icons/lu";
import { FaGear } from "react-icons/fa6";
import TransparentButton from "../transparent-button/transparent-button";
import { useState } from "react";
import { PiMoonFill } from "react-icons/pi";
import UserAvatar from "../user-avatar/user-avatar";
import { FaCircle } from "react-icons/fa";

interface UserAreaProps {
    user: UserData
    openSettingsHandler: () => any
}
export default function UserArea({ user, openSettingsHandler }: UserAreaProps) {
    const [isHovering, setIsHovering] = useState(false);

    if (!user) {
        return <div></div>;
    }
    console.log(user.profile.status);

    return (
        <div className={styles["container"]} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <div className={styles["user-info-container"]}>
                <UserAvatar user={user.profile} showStatus={true} />
                <div className={styles["user-identifier-wrapper"]}>
                    <p className={styles["display-name-text"]}>{user!.profile.displayName}</p>
                    <div className={styles["subtext"]}>
                        <p className={`${styles["status-text"]} ${styles["subtext"]} ${isHovering && styles["status-text-hover"]}`}>{UserStatusString[user!.profile.status]}</p>
                        <p className={`${styles["username-text"]} ${styles["subtext"]} ${isHovering && styles["username-text-hover"]}`}>{user!.profile.username}</p>

                    </div>
                </div>
            </div>
            <div className={styles["setting-wrapper"]}>
                <TransparentButton
                    tooltipSize="14px"
                    tooltip="Turn Off Microphone"
                    tooltipPosition="top">
                    <div className={styles["icon-container"]}>
                        <BsMicFill size={18} />
                    </div>
                </TransparentButton>
                <TransparentButton
                    tooltipSize="14px"
                    tooltip="Deafen"
                    tooltipPosition="top">
                    <div className={styles["icon-container"]}>
                        <LuHeadphones size={18} />
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
        </div>
    );
}