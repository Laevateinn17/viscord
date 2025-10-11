import { UserStatus } from "@/enums/user-status.enum";
import { UserProfile } from "@/interfaces/user-profile";
import { create } from "zustand";

type UserProfileMap = Map<string, UserProfile>;


interface UserProfileStoreState {
    userProfiles: UserProfileMap;
    setUserProfiles: (userProfiles: UserProfileMap) => void;
    updateStatus: (userId: string, status: UserStatus) => void;
    getUserProfile: (userId: string) => UserProfile | undefined;
    addUserProfile: (userProfile: UserProfile) => void;
}

export const useUserProfileStore = create<UserProfileStoreState>((set, get) => ({
    userProfiles: new Map(),
    setUserProfiles: (userProfiles: UserProfileMap) => {
        set({ userProfiles })
    },
    updateStatus: (userId, status) => {
        set(state => {
            const user = state.userProfiles.get(userId);
            if (!user) return state;

            const updatedUser: UserProfile = { ...user, status };

            const newMap = new Map(state.userProfiles);
            newMap.set(user.id, updatedUser);

            return { userProfiles: newMap };
        });
    },
    getUserProfile: (userId: string) => {
        return get().userProfiles.get(userId);
    },
    addUserProfile: (userProfile: UserProfile) => {
        set((state) => {
            const newMap = new Map(state.userProfiles);
            newMap.set(userProfile.id, userProfile);

            return { userProfiles: newMap };
        })
    }
}));


export function useGetUserProfile(userId: string) {
    return useUserProfileStore(state => state.getUserProfile(userId));
}