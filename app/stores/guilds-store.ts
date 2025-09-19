import { Guild } from "@/interfaces/guild";
import { create } from "zustand";

type GuildMap = Map<string, Guild>;

interface GuildStoreState {
    guilds: Map<string, Guild>,
    setGuilds: (guilds: GuildMap) => void,
    addGuild: (guild: Guild) => void,
    removeGuild: (guildId: string) => void,
    getGuild: (guildId: string) => Guild | undefined
}

export const useGuildsStore = create<GuildStoreState>((set, get) => ({
    guilds: new Map(),
    setGuilds: (guilds) => set({ guilds }),
    addGuild: (guild) => set((state) => {
        const newGuilds = new Map(state.guilds);
        newGuilds.set(guild.id, guild);

        return { guilds: newGuilds };
    }),
    removeGuild: (guildId) => set((state) => {
        const newGuilds = new Map(state.guilds);
        newGuilds.delete(guildId);

        return { guilds: newGuilds };
    }),
    getGuild: (guildId) => get().guilds.get(guildId)
}))

export const useGetGuild = (guildId: string) => useGuildsStore.getState().getGuild(guildId);



