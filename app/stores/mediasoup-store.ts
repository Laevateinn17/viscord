import { create } from "zustand";
import { Device } from "mediasoup-client";
import { Consumer, Producer, Transport } from "mediasoup-client/types";
import { Socket } from "socket.io-client";

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
    console.log(map);
    set({activeSpeakers: map});
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

  cleanup: () => {
    console.log('cleaning up mediasoujp');
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
