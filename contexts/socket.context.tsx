"use client"
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import Relationship from "@/interfaces/relationship";
import { FRIEND_ADDED_EVENT, FRIEND_REMOVED_EVENT, FRIEND_REQUEST_RECEIVED_EVENT, GET_USERS_PRESENCE_EVENT, GET_VOICE_RINGS_EVENT, GET_VOICE_STATES_EVENT, MESSAGE_RECEIVED_EVENT, USER_OFFLINE_EVENT, USER_ONLINE_EVENT, USER_STATUS_UPDATE_EVENT, USER_TYPING_EVENT, VOICE_RING_CANCEL, VOICE_RING_DISMISS_EVENT, VOICE_RING_EVENT, VOICE_UPDATE_EVENT } from "@/constants/events";
import { MESSAGES_CACHE, RELATIONSHIPS_CACHE } from "@/constants/query-keys";
import { Message } from "@/interfaces/message";
import { HttpStatusCode } from "axios";
import { refreshToken } from "@/services/auth/auth.service";
import { UserStatus } from "@/enums/user-status.enum";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useUserTypingStore } from "@/app/stores/user-typing-store";
import { VoiceState } from "@/interfaces/voice-state";
import { getVoiceStateKey, useGetChannelVoiceStates, useVoiceStateStore } from "@/app/stores/voice-state-store";
import { VoiceEventDTO } from "@/interfaces/dto/voice-event.dto";
import { VoiceEventType } from "@/enums/voice-event-type";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useSocketStore } from "@/app/stores/socket-store";
import { useUserPresenceStore } from "@/app/stores/user-presence-store";

export interface SocketContextType {
    socket: Socket | undefined;
    isReady: boolean;
}

const SocketContext = createContext<SocketContextType>(null!);

export function useSocket() {
    return useContext(SocketContext);
}

export default function SocketProvider({ children }: { children: ReactNode }) {
    const { socket, initializeSocket } = useSocketStore();
    const [isConnected, setIsConnected] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const queryClient = useQueryClient();
    const { presenceMap, updatePresence } = useUserPresenceStore();
    const { userProfiles, updateStatus } = useUserProfileStore();
    const { handleTypingStart, handleTypingStop } = useUserTypingStore();
    const { updateVoiceState, removeVoiceState, setVoiceStates } = useVoiceStateStore();
    const { ready } = useMediasoupStore();


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
        console.log(userId, 'online');
        updatePresence(userId, true);
    }

    function handleFriendOffline(userId: string) {
        console.log(userId, 'offline');
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

    const handleUserStatusUpdate = useCallback((payload: { userId: string, status: UserStatus }) => {
        updateStatus(payload.userId, payload.status);
    }, [updateStatus]);

    const handleUserTyping = useCallback((payload: { userId: string, channelId: string }) => {
        handleTypingStart(payload.channelId, payload.userId);
    }, [handleTypingStart]);

    const handleVoiceStateUpdate = useCallback(async (event: VoiceEventDTO) => {
        if (event.type === VoiceEventType.VOICE_LEAVE) {
            removeVoiceState(event.channelId, event.userId);
        }
        else {
            updateVoiceState(event.data);
        }
    }, [removeVoiceState, updateVoiceState]);

    const handleGetVoiceStates = useCallback((payload: VoiceState[]) => {
        const map: Map<string, VoiceState> = new Map();
        for (const vs of payload) {
            map.set(getVoiceStateKey(vs.channelId, vs.userId), new VoiceState(vs.userId, vs.channelId, vs.isMuted, vs.isDeafened));
        }
        setVoiceStates(map);
    }, [setVoiceStates]);

    useEffect(() => {
        // const socket = io(process.env.NEXT_PUBLIC_WS_GATEWAY!, {
        //     withCredentials: true,
        //     reconnection: true,
        //     reconnectionDelay: 5000,
        // })
        const socket = initializeSocket();

        const handleConnect = () => {
            // console.log('Socket connected');
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            // console.log('Socket disconnected');
            setIsConnected(false);
            setIsReady(false);
        };

        const handleConnectError = (error: any) => {
            // console.log('Socket connection error:', error.description);
            if (error.description === HttpStatusCode.Unauthorized) {
                refreshToken();
            }
        };

        socket!.on('connect', handleConnect);
        socket!.on('disconnect', handleDisconnect);
        socket!.on('connect_error', handleConnectError);
        socket!.on(FRIEND_REQUEST_RECEIVED_EVENT, handleFriendReceived);
        socket!.on(FRIEND_REMOVED_EVENT, handleFriendRemoved);
        socket!.on(FRIEND_ADDED_EVENT, handleFriendAdded);
        socket!.on(USER_ONLINE_EVENT, handleFriendOnline);
        socket!.on(USER_OFFLINE_EVENT, handleFriendOffline);
        socket!.on(MESSAGE_RECEIVED_EVENT, handleMessageReceived);
        socket!.on(USER_TYPING_EVENT, handleUserTyping);
        socket!.on(USER_STATUS_UPDATE_EVENT, handleUserStatusUpdate);
        socket!.on(VOICE_UPDATE_EVENT, handleVoiceStateUpdate);
        socket!.on(GET_VOICE_STATES_EVENT, handleGetVoiceStates);

        const handleBeforeUnload = () => {
            socket?.disconnect();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        // setSocket(socket);
        return () => {
            socket.removeAllListeners();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        const socketAndMediasoupReady = isConnected && ready;

        if (socketAndMediasoupReady !== isReady) {
            setIsReady(socketAndMediasoupReady);
        }
    }, [isConnected, ready]);

    return (
        <SocketContext.Provider value={{ socket, isReady }}>
            {children}
        </SocketContext.Provider>
    );
}