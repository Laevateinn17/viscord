import { ChannelType } from "@/enums/channel-type.enum";
import { Channel } from "@/interfaces/channel";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

type ChannelMap = Record<string, Channel>;

interface ChannelsStoreState {
    channels: ChannelMap;
    setChannels: (channels: ChannelMap) => void;
    updateChannel: (channel: Channel) => void;
    getChannel: (channelId: string) => Channel | undefined;
}

export const useChannelsStore = create<ChannelsStoreState>((set, get) => ({
    channels: {},
    setChannels: (channels: ChannelMap) => {
        set({ channels });
    },
    updateChannel: (channel: Channel) => {
        set(state => ({
            channels: {
                ...state.channels,
                [channel.id]: channel
            }
        }));
    },
    getChannel: (channelId: string) => {
        return get().channels[channelId];
    }
}))

export const useGetChannel = (channelId: string) =>{
    return useChannelsStore(state => state.getChannel(channelId))
}

export const useGetDMChannels = () => {
    return useChannelsStore(useShallow(state => Object.values(state.channels).filter(ch => ch.type === ChannelType.DM)));
}