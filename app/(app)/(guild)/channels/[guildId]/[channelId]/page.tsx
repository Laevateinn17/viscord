"use client"
import { useGuildDetailQuery } from "@/hooks/queries";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
    const { guildId } = useParams();
    const router = useRouter();

    const { isPending, data: guild } = useGuildDetailQuery(guildId ? guildId.toString() : '');

    useEffect(() => {
        if (!guild) return;
        document.title = `Viscord | ${guild.name}`
    }, [guild])
    return <p>this is guild channels</p>
}