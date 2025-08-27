import { create } from "zustand";
import { Device } from "mediasoup-client";
import { Consumer, Producer, Transport } from "mediasoup-client/types";
import { Socket } from "socket.io-client";
import { CLOSE_PRODUCER } from "@/constants/events";

interface MediasoupStoreState {
  ready: boolean;
  socket?: Socket,
  device?: Device;
  channelId?: string;
  sendTransport?: Transport;
  recvTransport?: Transport;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  activeSpeakers: Map<string, boolean>;
  updateActiveSpeakers: (userId: string, isSpeaking: boolean) => void;
  setReady: (ready: boolean) => void;
  setSocket: (socket: Socket) => void;
  setDevice: (device: Device, channelId: string) => void;
  setSendTransport: (transport: Transport) => void;
  setRecvTransport: (transport: Transport) => void;
  addProducer: (id: string, producer: Producer) => void;
  removeProducer: (id: string) => void;
  addConsumer: (id: string, consumer: Consumer) => void;
  removeConsumer: (id: string) => void;
  startScreenShare: () => Promise<boolean>;
  stopScreenShare: () => Promise<boolean>;
  cleanup: () => void;
}

export const useMediasoupStore = create<MediasoupStoreState>((set, get) => ({
  ready: false,
  socket: undefined,
  device: undefined,
  channelId: undefined,
  sendTransport: undefined,
  recvTransport: undefined,
  producers: new Map(),
  consumers: new Map(),
  activeSpeakers: new Map(),
  updateActiveSpeakers: (userId: string, isSpeaking: boolean) => {
    const map = new Map(get().activeSpeakers);
    if (isSpeaking) map.set(userId, true);
    else map.delete(userId);
    set({ activeSpeakers: map });
  },
  setReady: (ready: boolean) => set({ ready }),
  setSocket: (socket: Socket) => { set({ socket }) },
  setDevice: (device, channelId) => set({ device, channelId }),
  setSendTransport: (transport) => set({ sendTransport: transport }),
  setRecvTransport: (transport) => set({ recvTransport: transport }),
  addProducer: (id, producer) => {
    const map = new Map(get().producers);
    map.set(id, producer);
    set({ producers: map });
  },
  removeProducer: (id) => {
    const map = new Map(get().producers);
    const producer = map.get(id);
    if (producer) {
      producer.close();
      map.delete(id);
    }
    set({ producers: map });
  },
  addConsumer: (id, consumer) => {
    const map = new Map(get().consumers);
    map.set(id, consumer);
    set({ consumers: map });
  },
  removeConsumer: (id) => {
    const map = new Map(get().consumers);
    const consumer = map.get(id);
    if (consumer) {
      consumer.close();
      map.delete(id);
    }
    set({ consumers: map });
  },
  startScreenShare: async () => {
    const { sendTransport, addProducer, socket, stopScreenShare, channelId } = get();
    console.log(sendTransport, socket, channelId);
    if (!sendTransport || !socket || !channelId) return false;
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 30,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: true
    });

    const videoTrack = stream.getVideoTracks()[0];
    const producer = await sendTransport.produce({
      track: videoTrack,
      appData: {
        mediaTag: "screen"
      }
    });
    addProducer(producer.id, producer);

    videoTrack.onended = () => { stopScreenShare(); };
    return true;
  },
  stopScreenShare: async () => {
    const { producers, removeProducer, socket } = get();
    const screenProducer = Array.from(producers.values()).find(p => p.appData?.mediaTag === 'screen');
    if (!screenProducer) return false;

    socket?.emit(CLOSE_PRODUCER, { producerId: screenProducer.id });

    removeProducer(screenProducer.id);
    screenProducer.close();

    return true;
  },
  cleanup: async () => {
    await get().stopScreenShare();
    get().producers.forEach((p) => p.close());
    get().consumers.forEach((c) => c.close());
    get().sendTransport?.close();
    get().recvTransport?.close();
    get().socket?.disconnect();
    set({
      socket: undefined,
      device: undefined,
      sendTransport: undefined,
      recvTransport: undefined,
      producers: new Map(),
      consumers: new Map(),
      channelId: undefined
    });
  },
}));
