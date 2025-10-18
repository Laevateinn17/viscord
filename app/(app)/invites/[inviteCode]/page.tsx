"use client"
import { useGuildsStore } from "@/app/stores/guilds-store";
import { joinGuild } from "@/services/invites/invites.service";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";


export default function ReceiveInvitePage() {
    const { inviteCode } = useParams();
    const { upsertGuild: addGuild } = useGuildsStore();
    const router = useRouter();

    useEffect(() => {
        joinGuild(inviteCode as string).then(response => {
            if (!response.success) {
                router.back()
                return;
            }
            const guild = response.data!;
            addGuild(response.data!);
            router.push(`/channels/${guild.id}`);
        });
    }, []);

    return <div></div>;
}