import { Channel } from "@/interfaces/channel";
import { Guild } from "@/interfaces/guild";
import { GuildMember } from "@/interfaces/guild-member";
import { Role } from "@/interfaces/role";
import { UserProfile } from "@/interfaces/user-profile";
import { IoMdReturnLeft } from "react-icons/io";
import { create } from "zustand";

type GuildMap = Map<string, Guild>;

interface GuildStoreState {
    guilds: Map<string, Guild>;
    setGuilds: (guilds: GuildMap) => void;
    addGuild: (guild: Guild) => void;
    removeGuild: (guildId: string) => void;
    getGuild: (guildId: string) => Guild | undefined;
    getChannel: (channelId: string) => Channel | undefined;
    addChannel: (guildId: string, channel: Channel) => void;
    updateChannel: (guildId: string, channelId: string, channel: Channel) => void;
    deleteChannel: (guildId: string, channelId: string) => void;
    updateChannelLastRead: (guildId: string, channelId: string, messageId: string) => void;
    upsertMember: (guildId: string, member: GuildMember) => void;
    removeMember: (guildId: string, memberId: string) => void;
    upsertRole: (guildId: string, role: Role) => void;
    removeRole: (guildId: string, roleId: string) => void;
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
    addChannel: (guildId, channel) => {
        set(state => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const updatedGuild = {
                ...guild,
                channels: [...guild.channels, channel],
            };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds }
        });
    },
    getGuild: (guildId) => get().guilds.get(guildId),
    getChannel: (channelId) => {
        const guilds = get().guilds;
        for (const guild of Array.from(guilds.values())) {
            const channel = guild.channels.find(ch => ch.id === channelId);
            if (channel) return channel;
        }

        return undefined;
    },
    deleteChannel: (guildId, channelId) => {
        set((state) => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const updatedChannels = guild.channels.filter((ch) => ch.id !== channelId);

            const updatedGuild: Guild = { ...guild, channels: updatedChannels };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds };
        })
    },
    updateChannel: (guildId, channelId, channel) => {
        set((state) => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const updatedChannels = guild.channels.map((ch) =>
                ch.id === channelId
                    ? { ...ch, ...channel }
                    : ch
            );

            const updatedGuild: Guild = { ...guild, channels: updatedChannels };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds };
        })
    },
    upsertMember: (guildId, member) => {
        set(state => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const existingMember = guild.members.find(m => m.userId === member.userId);
            const updatedMember = existingMember
                ? {
                    ...existingMember,
                    ...Object.fromEntries(
                        Object.entries(member).filter(([_, v]) => v !== undefined)
                    ),
                }
                : member;


            const updatedGuild: Guild = {
                ...guild,
                members: [...guild.members.filter(m => m.userId !== member.userId), updatedMember],
            };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds }
        });
    },
    removeMember: (guildId, memberId) => {
        set(state => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const updatedGuild: Guild = {
                ...guild,
                members: guild.members.filter(m => m.userId !== memberId),
            };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds }
        });
    },
    updateChannelLastRead: (guildId, channelId, messageId) => {
        set((state) => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const updatedChannels = guild.channels.map((channel) =>
                channel.id === channelId
                    ? { ...channel, lastReadId: messageId }
                    : channel
            );

            const updatedGuild: Guild = { ...guild, channels: updatedChannels };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds };
        })
    },
    upsertRole: (guildId, role) => {
        set(state => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const existingRole = guild.roles.find(r => r.id === role.id);
            const updatedRole = existingRole
                ? {
                    ...existingRole,
                    ...Object.fromEntries(
                        Object.entries(role).filter(([_, v]) => v !== undefined)
                    ),
                }
                : role;


            const updatedGuild: Guild = {
                ...guild,
                roles: [...guild.roles.filter(r => r.id !== role.id), updatedRole],
            };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds }
        });
    },
    removeRole: (guildId, roleId) => {
        set(state => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const updatedGuild: Guild = {
                ...guild,
                roles: guild.roles.filter(r => r.id !== roleId),
            };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds }
        });

    }
}))

export function useGetGuild(guildId: string) {
    return useGuildsStore.getState().getGuild(guildId);
}

export function useGetGuildChannel(channelId: string) {
    return useGuildsStore.getState().getChannel(channelId);
}

