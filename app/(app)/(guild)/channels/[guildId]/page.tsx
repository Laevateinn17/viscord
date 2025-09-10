"use client"
import { useDMChannelsQuery, useGuildDetailQuery, useGuildsQuery } from "@/hooks/queries";
import { Guild } from "@/interfaces/guild";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
    const { guildId } = useParams();
    const router = useRouter();

    const { isPending, data: guild } = useGuildDetailQuery(guildId ? guildId.toString() : '');

    useEffect(() => {
        if (!guild) return;
        document.title = `Viscord | ${guild.name}`
    }, [guild])

    return <></>;
}