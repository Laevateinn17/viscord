"use client"
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import Relationship from "@/interfaces/relationship";
import { FRIEND_ADDED_EVENT, FRIEND_REMOVED_EVENT, FRIEND_REQUEST_RECEIVED_EVENT, GET_USERS_STATUS_EVENT, MESSAGE_RECEIVED_EVENT, USER_OFFLINE_EVENT, USER_ONLINE_EVENT, USER_STATUS_UPDATE_EVENT, USER_TYPING_EVENT } from "@/constants/events";
import { MESSAGES_CACHE, RELATIONSHIPS_CACHE } from "@/constants/cache";
import { Message } from "@/interfaces/message";
import { HttpStatusCode } from "axios";
import { refreshToken } from "@/services/auth/auth.service";
import { useCurrentUserQuery } from "@/hooks/queries";
import { useUserPresence } from "./user-presence.context";
import { UserStatus } from "@/enums/user-status.enum";
import { useAppState } from "./app-state.context";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useUserTypingStore } from "@/app/stores/user-typing-store";

export interface SocketContextType {
    socket: Socket;
    isReady: boolean;
}

const SocketContext = createContext<SocketContextType>(null!);

export function useSocket() {
    return useContext(SocketContext);
}

export default function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket>(null!)
    const [isReady, setIsReady] = useState(false);
    const { data: user } = useCurrentUserQuery();
    const queryClient = useQueryClient();
    const { presenceMap, updatePresence, } = useUserPresence();
    const { userProfiles, updateStatus } = useUserProfileStore();
    const { handleTypingStart, handleTypingStop } = useUserTypingStore();


    function handleFriendReceived(payload: Relationship) {
        queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
            if (!old) {
                return [payload];
            }
            return [...old, payload];
        })
    }

    function handleFriendAdded(payload: Relationship) {
        queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
            if (!old) {
                return [payload];
            }
            return old.map(rel => rel.id === payload.id ? payload : rel);
        })
    }

    function handleFriendRemoved(payload: Relationship) {
        queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
            if (!old) {
                return [];
            }
            return old.filter(rel => rel.id !== payload.id);
        })
    }

    function handleFriendOnline(userId: string) {
        updatePresence(userId, true);
    }

    function handleFriendOffline(userId: string) {
        updatePresence(userId, false);
    }

    function handleMessageReceived(payload: Message) {
        handleTypingStop(payload.channelId, payload.senderId);
        queryClient.setQueryData<Message[]>([MESSAGES_CACHE, payload.channelId], (old) => {
            if (!old) {
                return [];
            }

            payload.createdAt = new Date(payload.createdAt);

            const newMessages = [...old, payload];
            return newMessages;
        })
    }

    const handleUserStatusUpdate = (payload: { userId: string, status: UserStatus }) => {
        updateStatus(payload.userId, payload.status);
    };

    const handleUserTyping = (payload: {userId: string, channelId: string}) => {
        handleTypingStart(payload.channelId, payload.userId);
    }

    useEffect(() => {
        if (!socket) return;
        socket.on(USER_STATUS_UPDATE_EVENT, handleUserStatusUpdate);
    }, [userProfiles, socket])

    useEffect(() => {
        if (!socket) return;
        socket.on(FRIEND_REQUEST_RECEIVED_EVENT, handleFriendReceived);
        socket.on(FRIEND_REMOVED_EVENT, handleFriendRemoved);
        socket.on(FRIEND_ADDED_EVENT, handleFriendAdded);
        socket.on(USER_ONLINE_EVENT, handleFriendOnline);
        socket.on(USER_OFFLINE_EVENT, handleFriendOffline);
        socket.on(MESSAGE_RECEIVED_EVENT, handleMessageReceived);
        socket.on(USER_TYPING_EVENT, handleUserTyping)
        socket.on("connect", () => {
            setIsReady(true);
        });
        socket.on('connect_error', (error: any) => {
            if (error.description === HttpStatusCode.Unauthorized) {
                refreshToken();
            }
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            setIsReady(false);
        }

    }, [socket])

    useEffect(() => {
        if (!user || isReady) return;

        const sock = io(process.env.NEXT_PUBLIC_WS_GATEWAY, {
            withCredentials: true
        });
        setSocket(sock);
    }, [user]);


    return <SocketContext.Provider value={{ socket, isReady }}>
        {children}
    </SocketContext.Provider>
}