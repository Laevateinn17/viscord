import { SettingsOverlayType } from "@/enums/settings-overlay-type.enum";
import { create } from "zustand";


interface SettingsOverlayMetadata {
    type: SettingsOverlayType;
    data?: any;
}


interface SettingsOverlayStore {
    metadata: SettingsOverlayMetadata | null;
    openSettings: (type: SettingsOverlayType, data?: any) => void;
    closeSettings: () => void;
}

export const useSettingsOverlay = create<SettingsOverlayStore>((set, get) => ({
    metadata: null,
    openSettings: (type, data) => set({metadata: {type, data}}),
    closeSettings: () => set({metadata: null})
}));