import { VoiceState } from "@/interfaces/voice-state";
import { kMaxLength } from "buffer";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

type VoiceStateMap = Map<string, VoiceState>

interface VoiceStateStoreState {
    voiceStates: Map<string, VoiceState>;
    setVoiceStates: (voiceStates: VoiceStateMap) => void;
    updateVoiceState: (voiceState: VoiceState) => void;
    removeVoiceState: (channelId: string, userId: string) => void;
    getVoiceState: (channelId: string, userId: string) => void;
}

export const useVoiceStateStore = create<VoiceStateStoreState>((set, get) => ({
    voiceStates: new Map(),
    setVoiceStates: (voiceStates: VoiceStateMap) => set({ voiceStates }),
    updateVoiceState: (voiceState: VoiceState) => {
        set(state => {
            const newVoiceStates = new Map(state.voiceStates);
            const oldVoiceState = newVoiceStates.get(
                getVoiceStateKey(voiceState.channelId, voiceState.userId)
            );

            let merged: VoiceState;

            if (oldVoiceState) {
                merged = new VoiceState(
                    voiceState.userId ?? oldVoiceState.userId,
                    voiceState.channelId ?? oldVoiceState.channelId,
                    voiceState.isMuted ?? oldVoiceState.isMuted,
                    voiceState.isDeafened ?? oldVoiceState.isDeafened
                );
            } else {
                merged = new VoiceState(
                    voiceState.userId,
                    voiceState.channelId,
                    voiceState.isMuted,
                    voiceState.isDeafened
                );
            }

            newVoiceStates.set(getVoiceStateKey(merged.channelId, merged.userId), merged);

            return { voiceStates: newVoiceStates };
        });

    },
    removeVoiceState: (channelId: string, userId: string) => {
        set((state) => {
            const newVoiceStates = new Map(state.voiceStates)
            const vs = newVoiceStates.get(getVoiceStateKey(channelId, userId));
            if (vs) {
                newVoiceStates.delete(getVoiceStateKey(vs.channelId, vs.userId));
            }

            return { voiceStates: newVoiceStates };
        })
    },
    getVoiceState: (channelId: string, userId: string) => {
        return get().voiceStates.get(getVoiceStateKey(channelId, userId));
    },
}));

export function getVoiceStateKey(channelId: string, userId: string) {
    return `${channelId}:${userId}`
}

export function useGetChannelVoiceStates(channelId: string): VoiceState[] {
    const voiceStates = useVoiceStateStore.getState().voiceStates;

    return Array.from(voiceStates.entries())
        .filter(([key]) => key.startsWith(channelId))
        .map(([, state]) => state);
}