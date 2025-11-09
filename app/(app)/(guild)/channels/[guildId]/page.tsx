"use client"
import { useGuildsStore } from "@/app/stores/guilds-store";
import { useDMChannelsQuery, useGuildDetailQuery } from "@/hooks/queries";
import { Guild } from "@/interfaces/guild";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
    const { guildId } = useParams();
    const router = useRouter();

    // const { isPending, data: guild } = useGuildDetailQuery(guildId ? guildId.toString() : '');
    const {getGuild} = useGuildsStore();
    const guild = getGuild(guildId as string); 

    useEffect(() => {
        if (!guild) return;
        document.title = `Viscord | ${guild.name}`
    }, [guild])

    return <></>;
}