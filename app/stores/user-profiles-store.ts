import { UserStatus } from "@/enums/user-status.enum";
import { UserProfile } from "@/interfaces/user-profile";
import { create } from "zustand";

type UserProfileMap = Record<string, UserProfile>;


interface UserProfileStoreState {
    userProfiles: UserProfileMap;
    setUserProfiles: (userProfiles: UserProfileMap) => void;
    updateStatus: (userId: string, status: UserStatus) => void;
    updatePresence: (userId: string, isOnline: boolean) => void;
    getUserProfile: (userId: string) => UserProfile | undefined;
}

export const useUserProfileStore = create<UserProfileStoreState>((set, get) => ({
    userProfiles: {},
    setUserProfiles: (userProfiles: UserProfileMap) => {
        set({ userProfiles })
    },
    updateStatus: (userId, status) => {
        const currentProfiles = get().userProfiles;
        if (!currentProfiles[userId]) return;

        set({
            userProfiles: {
                ...currentProfiles,
                [userId]: {
                    ...currentProfiles[userId],
                    status: status,
                },
            },
        });
    },
    updatePresence: (userId, isOnline) => {
        const currentProfiles = get().userProfiles;
        if (!currentProfiles[userId]) return;

        set({
            userProfiles: {
                ...currentProfiles,
                [userId]: {
                    ...currentProfiles[userId],
                    isOnline: isOnline
                }
            }
        })
    },
    getUserProfile: (userId: string) => {
        return get().userProfiles[userId];
    }
}));


export function useGetUserProfile(userId: string) {
    return useUserProfileStore(state => state.getUserProfile(userId));
}