"use client"

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth.context";
import { ReactNode, Suspense, useEffect, useState } from "react";
import SocketProvider, { useSocket } from "@/contexts/socket.context";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import AppStateProvider, { useAppState } from "@/contexts/app-state.context";
import { useCurrentUserQuery, useDMChannelsQuery, useRelationshipsQuery } from "@/hooks/queries";
import { GET_USERS_STATUS_EVENT, GET_USERS_STATUS_RESPONSE_EVENT } from "@/constants/events";
import { getRelationships } from "@/services/relationships/relationships.service";
import Relationship from "@/interfaces/relationship";
import { RELATIONSHIPS_CACHE } from "@/constants/cache";
import { UserProfile } from "@/interfaces/user-profile";
import { UserPresenceProvider, useUserPresence } from "@/contexts/user-presence.context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const queryClient = new QueryClient();
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        <AppStateProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
                    {children}
            </QueryClientProvider>
          </AuthProvider>
        </AppStateProvider>
      </body>
    </html>
  );
}
