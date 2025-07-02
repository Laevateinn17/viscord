"use client"

import { useAuth } from "@/contexts/auth.context";
import { useCurrentUserQuery } from "@/hooks/queries";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"


export default function NotFoundPage() {
    const router = useRouter();
    const {data: user} = useCurrentUserQuery();
    useEffect(() => {
        if (user !== null) {
            if (user !== undefined) {
                router.push("/channels/me");
            }
        }
        else {
            router.push("/login");
        }
    }, [user])

    return (
        <div>
            not found
        </div>
    )
}