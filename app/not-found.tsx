"use client"

import { useAuth } from "@/contexts/auth.context";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"


export default function NotFoundPage() {
    const router = useRouter();
    return (
        <div>
            not found
        </div>
    )
}