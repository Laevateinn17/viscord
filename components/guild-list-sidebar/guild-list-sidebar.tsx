import { GuildSummary } from "@/interfaces/guild-summary";
import GuildIcon from "../guild-icon/guild-icon";
import styles from "./styles.module.css"
import { useEffect } from "react";
const directMessageIcon: GuildSummary = {
    name: "Direct Messages",
    id: "me"
};

export default function GuildListSidebar() {
    function DMButton() {
        return (
            <GuildIcon guildData={directMessageIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0.840821 3.3614 21.83 16.8" width={29} height={29}>
                    <path d="M 19.3354 4.7726 a 17.836 17.836 90 0 0 -4.508 -1.4112 c -0.2058 0.392 -0.392 0.784 -0.5684 1.1858 c -1.6562 -0.245 -3.332 -0.245 -4.998 0 c -0.1764 -0.4018 -0.3626 -0.8036 -0.5782 -1.176 c -1.568 0.2646 -3.0772 0.735 -4.508 1.4014 A 18.6592 18.6592 90 0 0 0.9408 17.346 a 18.0614 18.0614 90 0 0 5.5174 2.8126 c 0.4508 -0.6076 0.8428 -1.2544 1.176 -1.9404 c -0.637 -0.245 -1.2642 -0.539 -1.862 -0.9016 c 0.1666 -0.1176 0.3136 -0.2352 0.4606 -0.3626 c 3.5084 1.666 7.546 1.666 11.0544 0 l 0.4508 0.3626 c -0.588 0.3528 -1.225 0.6566 -1.862 0.9016 c 0.343 0.686 0.735 1.323 1.176 1.9404 c 1.9894 -0.6174 3.8612 -1.568 5.5272 -2.8126 c 0.4606 -4.7726 -0.7644 -8.9082 -3.234 -12.5734 Z M 8.134 14.8176 c -1.078 0 -1.96 -0.9996 -1.96 -2.2246 c 0 -1.2152 0.8624 -2.2148 1.96 -2.2148 s 1.9796 0.9996 1.96 2.2148 c 0 1.225 -0.8722 2.2246 -1.96 2.2246 Z m 7.252 0 c -1.078 0 -1.96 -0.9996 -1.96 -2.2246 c 0 -1.2152 0.8624 -2.2148 1.96 -2.2148 s 1.9796 0.9996 1.96 2.2148 c 0 1.225 -0.8624 2.2246 -1.96 2.2246 Z" fill="#dbdee1" />
                </svg>
            </GuildIcon>
        );
    }

    useEffect(() => {
        console.log("rerender")
    }, [])
    return (
        <div className={styles["guild-list-container"]}>
            <DMButton/>
            <div className={styles["horizontal-divider"]}></div>

        </div>
    );
}
