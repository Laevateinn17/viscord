"use client";

import { create } from "zustand";
import { UserProfile } from "@/interfaces/user-profile";

type PresenceMap = Record<string, boolean>;
type UserProfileMap = Record<string, UserProfile>;

interface UserPresenceStore {
  presenceMap: PresenceMap;
  userProfileMap: UserProfileMap;

  // actions
  setPresenceMap: (map: PresenceMap) => void;
  updatePresence: (userId: string, isOnline: boolean) => void;
  isUserOnline: (userId: string) => boolean;

  setUserProfileMap: (map: UserProfileMap) => void;
  getUserProfile: (userId: string) => UserProfile | undefined;
  updateUserProfile: (userProfile: UserProfile) => void;
}

export const useUserPresenceStore = create<UserPresenceStore>((set, get) => ({
  presenceMap: {},
  userProfileMap: {},

  setPresenceMap: (map) => set({ presenceMap: map }),

  updatePresence: (userId, isOnline) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: isOnline },
    })),

  isUserOnline: (userId) => !!get().presenceMap[userId],

  setUserProfileMap: (map) => set({ userProfileMap: map }),

  getUserProfile: (userId) => get().userProfileMap[userId],

  updateUserProfile: (userProfile) =>
    set((state) => ({
      userProfileMap: { ...state.userProfileMap, [userProfile.id]: userProfile },
    })),
}));
