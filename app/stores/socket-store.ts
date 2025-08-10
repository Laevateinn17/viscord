import { io, Socket } from "socket.io-client";
import { create } from "zustand";

interface SocketStoreState {
    socket: Socket | undefined,
    initializeSocket: () => Socket,
}

export const useSocketStore = create<SocketStoreState>((set, get) => ({
    socket: undefined,
    initializeSocket: () => {
        const { socket } = get();
        console.log(socket)
        if (socket) return socket;

        const newSocket = io(process.env.NEXT_PUBLIC_WS_GATEWAY!, {
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 5000,
        });

        set({ socket: newSocket });

        return newSocket;
    }
}))