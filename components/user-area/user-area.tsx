import { useAuth } from "@/contexts/auth.context";
import styles from "./styles.module.css"
import { UserData } from "@/interfaces/UserData";
import { UserStatus, UserStatusString } from "@/enums/user-status.enum";
import { MdDoNotDisturbOn, MdOutlineCircle } from "react-icons/md";
import { BsMicFill } from "react-icons/bs";
import { LuHeadphoneOff, LuHeadphones } from "react-icons/lu";
import { FaCircle, FaCircleDot, FaGear, FaMoon } from "react-icons/fa6";
import Tooltip from "../tooltip/tooltip";
import TransparentButton from "../transparent-button/transparent-button";
import { useState } from "react";
import { PiMoonFill } from "react-icons/pi";

interface UserAreaProps {
    user: UserData
    openSettingsHandler: () => any
}
export default function UserArea({ user, openSettingsHandler }: UserAreaProps) {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div className={styles["container"]} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <div className={styles["user-info-container"]}>
                <div className={styles["pfp-wrapper"]}>
                    <div className={styles["pfp-container"]}>
                    </div>
                    <div className={styles["status-container"]}>
                        {user.profile.status == UserStatus.DoNotDisturb && <MdDoNotDisturbOn fill="#f23f43" size={13}/>}
                        {(user.profile.status === UserStatus.Invisible || user.profile.status == UserStatus.Offline) && <MdOutlineCircle className={styles["offline-icon"]} fill="#80848e" size={12}/>}
                        {user.profile.status === UserStatus.DoNotDisturb && <MdDoNotDisturbOn fill="#f23f43" size={13}/>}
                        {user.profile.status === UserStatus.Idle && <PiMoonFill fill="#f0b232" className={styles["idle-icon"]} size={12}/>}
                    </div>
                </div>
                <div className={styles["user-identifier-wrapper"]}>
                    <p className={styles["display-name-text"]}>{user!.profile.displayName}</p>
                    <div className={styles["subtext"]}>
                        <p className={`${styles["status-text"]} ${styles["subtext"]} ${isHovering && styles["status-text-hover"]}`}>{UserStatusString[user!.profile.status]}</p>
                        <p className={`${styles["username-text"]} ${styles["subtext"]} ${isHovering && styles["username-text-hover"]}`}>{user!.username}</p>

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