"use client"
import PrimaryButton from "@/components/primary-button/primary-button";
import styles from "./styles.module.css"
import { refreshToken } from "@/services/auth/auth.service";
import { getCurrentUserData } from "@/services/users/users.service";

export default function MeChannelHeader() {

    async function test() {
        await getCurrentUserData();
    }

    return (
        <div className={styles["search-container"]}>
            <p className={styles["search-placeholder"]}>Find or start a conversation</p>
        </div>
    );
}