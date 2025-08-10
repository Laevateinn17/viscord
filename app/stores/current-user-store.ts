import { UserData } from "@/interfaces/user-data";
import { create } from "zustand";

interface CurrentUserStoreState {
    user: UserData;
    setCurrentUser: (user: UserData) => void;
}

export const useCurrentUserStore = create<CurrentUserStoreState>((set, get) => ({
    user: null!,
    setCurrentUser: user => {console.log('setting user'); set({ user }) }
}))