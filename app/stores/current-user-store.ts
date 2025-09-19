import { UserStatus } from "@/enums/user-status.enum";
import { UserData } from "@/interfaces/user-data";
import { create } from "zustand";

interface CurrentUserStoreState {
    user: UserData;
    setCurrentUser: (user: UserData) => void;
    updateStatus: (status: UserStatus) => void;
}

export const useCurrentUserStore = create<CurrentUserStoreState>((set, get) => ({
    user: null!,
    setCurrentUser: user => set({ user }),
    updateStatus: (status) => {
        set((state) =>
            state.user
                ? {
                    user: {
                        ...state.user,
                        profile: {
                            ...state.user.profile,
                            status,
                        },
                    },
                }
                : state
        )
    }
}))