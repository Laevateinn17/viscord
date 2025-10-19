import { CURRENT_USER_CACHE, GUILDS_CACHE, MESSAGES_CACHE, RELATIONSHIPS_CACHE } from "@/constants/query-keys";
import { RelationshipType } from "@/enums/relationship-type.enum";
import { CreateMessageDto } from "@/interfaces/dto/create-message.dto";
import Relationship from "@/interfaces/relationship";
import { logout } from "@/services/auth/auth.service";
import { acknowledgeMessage, sendMessage } from "@/services/messages/messages.service";
import { acceptFriendRequest, declineFriendRequest } from "@/services/relationships/relationships.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Message } from "@/interfaces/message";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { MessageStatus } from "@/enums/message-status.enum";
import { useChannelsStore, useGetChannel } from "@/app/stores/channels-store";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { createDMChannel, createGuildChannel, deleteChannel, deletePermissionOverwrite, syncChannel, updatePermissionOverwrite } from "@/services/channels/channels.service";
import { CreateChannelDTO } from "@/interfaces/dto/create-channel.dto";
import { Guild } from "@/interfaces/guild";
import { joinGuild } from "@/services/invites/invites.service";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { assignRoleMembers, createRole, deleteRole, leaveGuild, updateGuild, updateMember, updateRole } from "@/services/guild/guild.service";
import { AssignRoleDTO } from "@/interfaces/dto/assign-role.dto";
import { UpdateMemberDTO } from "@/interfaces/dto/update-member.dto";
import { Role } from "@/interfaces/role";
import { PermissionOverwrite } from "@/interfaces/permission-ovewrite";
import { updatePermissionOverwriteDTO } from "@/interfaces/dto/update-permission-overwrite.dto";
import { Channel } from "@/interfaces/channel";
import { UpdateGuildDTO } from "@/interfaces/dto/update-guild.dto";
import { DeleteRoleDTO } from "@/interfaces/dto/delete-role.dto";




export function useLogoutMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => await logout(),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: [CURRENT_USER_CACHE] });
        }
    });
}

export function useDeleteRelationshipMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (relationship: Relationship) => declineFriendRequest(relationship.id),
        onSuccess: (_, relationship) => {
            queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
                if (!old) {
                    return [];
                }
                return old.filter(rel => rel.id !== relationship.id);
            })
        }
    });
}

export function useAcceptFriendRequestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (relationship: Relationship) => acceptFriendRequest(relationship.id),
        onSuccess: (_, relationship) => {
            queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
                if (!old) {
                    return [relationship];
                }
                return old.map((rel) =>
                    rel.id === relationship.id ? { ...rel, type: RelationshipType.Friends } : rel
                );
            })
        }
    });
}

export function useSendMessageMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateMessageDto) => sendMessage(dto),
        onMutate: (dto) => {
            const messages = queryClient.getQueryData<Message[]>([MESSAGES_CACHE, dto.channelId]);
            const { user } = useCurrentUserStore.getState();
            const { getChannel, updateChannel } = useChannelsStore.getState();
            const channel = getChannel(dto.channelId);

            const id = `pending-${messages!.length}`
            const createdAt = new Date();
            const message: Message = {
                id: id,
                createdAt: createdAt,
                updatedAt: createdAt,
                senderId: user.id,
                status: MessageStatus.Pending,
                attachments: [],
                channelId: dto.channelId,
                content: dto.content,
                mentions: dto.mentions,
                is_pinned: false,
            };

            if (channel) {
                updateChannel({ ...channel, lastMessageId: message.id, userChannelState: { ...channel.userChannelState, lastReadId: message.id, unreadCount: 0 } });
            }

            queryClient.setQueryData<Message[]>([MESSAGES_CACHE, dto.channelId], (old) => {
                if (!old) {
                    return [];
                }

                const newMessages = [...old, message];

                return newMessages;
            });

            //TODO: handle error when sending message
            return message;
        },
        onSuccess: (response, dto, optimisticMessage) => {
            const { getChannel, updateChannel } = useChannelsStore.getState();
            const channel = getChannel(dto.channelId);
            if (!response.success) {
                queryClient.setQueryData<Message[]>([MESSAGES_CACHE, dto.channelId], (old) => {
                    if (!old) {
                        return [];
                    }

                    const newMessages = [...old].map(m => {
                        if (m.id === message.id) {
                            m.status = MessageStatus.Error;
                        }
                        return m;
                    });
                    return newMessages;
                })
                return;
            }

            const message = response.data!;
            queryClient.setQueryData<Message[]>([MESSAGES_CACHE, dto.channelId], (old) => {
                if (!old) {
                    return [];
                }
                message.createdAt = new Date(message.createdAt);

                const newMessages = [...old].map(m => {
                    if (m.id === optimisticMessage.id) {
                        return response.data!;
                    }
                    return m;
                });
                return newMessages;
            });

            if (!channel) return;
            updateChannel({ ...channel, lastMessageId: response.data!.id, userChannelState: { ...channel.userChannelState, lastReadId: response.data?.id } });
        }
    })
}

export function useSendMessageGuildMutation(guildId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateMessageDto) => sendMessage(dto),
        onMutate: (dto) => {
            const messages = queryClient.getQueryData<Message[]>([MESSAGES_CACHE, dto.channelId]) ?? [];
            const { user } = useCurrentUserStore.getState();
            const { getChannel, updateChannel } = useChannelsStore.getState();
            const { getGuild, updateChannelLastRead } = useGuildsStore.getState();
            const guild = getGuild(guildId as string);
            const channel = guild?.channels.find(ch => ch.id === dto.channelId);

            const id = `pending-${messages.length}`
            const createdAt = new Date();
            const message: Message = {
                id: id,
                createdAt: createdAt,
                updatedAt: createdAt,
                senderId: user.id,
                status: MessageStatus.Pending,
                attachments: [],
                channelId: dto.channelId,
                content: dto.content,
                mentions: dto.mentions,
                is_pinned: false,
            };

            queryClient.setQueryData<Message[]>([MESSAGES_CACHE, dto.channelId], (old) => {
                if (!old) {
                    return [];
                }

                const newMessages = [...old, message];

                return newMessages;
            });

            if (channel) {
                updateChannelLastRead(guildId, dto.channelId, message.id);
            }


            return message;
        },
        onSuccess: (response, dto, optimisticMessage) => {
            const { getGuild, updateChannelLastRead } = useGuildsStore.getState();
            const guild = getGuild(guildId as string);
            const channel = guild?.channels.find(ch => ch.id === dto.channelId);
            if (!response.success) {
                queryClient.setQueryData<Message[]>([MESSAGES_CACHE, dto.channelId], (old) => {
                    if (!old) {
                        return [];
                    }

                    const newMessages = [...old].map(m => {
                        if (m.id === message.id) {
                            m.status = MessageStatus.Error;
                        }
                        return m;
                    });
                    return newMessages;
                })
                return;
            }

            const message = response.data!;
            queryClient.setQueryData<Message[]>([MESSAGES_CACHE, dto.channelId], (old) => {
                if (!old) {
                    return [];
                }
                message.createdAt = new Date(message.createdAt);

                const newMessages = [...old].map(m => {
                    if (m.id === optimisticMessage.id) {
                        return response.data!;
                    }
                    return m;
                });
                return newMessages;
            });

            if (!channel) return;
            updateChannelLastRead(guildId as string, dto.channelId as string, response.data!.id);
        }
    })
}

export function useCreateGuildChannelMutation() {
    return useMutation({
        mutationFn: (dto: CreateChannelDTO) => createGuildChannel(dto),
        onSuccess: (response, dto) => {
            const { upsertChannel } = useGuildsStore.getState();
            if (!response.success) throw new Error(response.message as string);
            upsertChannel(dto.guildId, response.data!.id, response.data!);
        }
    })
}

export function useCreateDMChannelMutation() {
    return useMutation({
        mutationFn: (recipientId: string) => createDMChannel(recipientId),
        onSuccess: (response) => {
            const { updateChannel } = useChannelsStore.getState();
            if (!response.success) throw new Error(response.message as string);
            updateChannel(response.data!);
        }
    })
}

export function useDeleteGuildChannelMutation(guildId: string) {
    return useMutation({
        mutationFn: (channelId: string) => deleteChannel(channelId),
        onSuccess: (response, channelId) => {
            const { deleteChannel: deleteGuildChannel } = useGuildsStore.getState();

            if (!response.success) throw new Error(response.message as string);
            deleteGuildChannel(guildId, channelId);
        }
    });
}

export function useAcknowledgeMessageMutation() {
    return useMutation({
        mutationFn: (dto: { channelId: string, messageId: string }) => acknowledgeMessage(dto.channelId, dto.messageId),
        onMutate: (dto) => {
            const { getChannel, updateChannel } = useChannelsStore.getState();
            const channel = getChannel(dto.channelId);
            if (!channel) return;
            updateChannel({ ...channel, userChannelState: { ...channel.userChannelState, lastReadId: dto.messageId, unreadCount: 0 } })
        }
    });
}

export function useJoinGuildMutation() {
    return useMutation({
        mutationFn: (inviteCode: string) => joinGuild(inviteCode),
        onSuccess: (response) => {
            if (!response.success) throw new Error(response.message as string);

            const { upsertGuild: addGuild } = useGuildsStore.getState();
            const { addUserProfile } = useUserProfileStore.getState();
            const guild = response.data!;

            addGuild(guild);
            for (const member of guild.members) addUserProfile(member.profile);
        }
    });
}

export function useLeaveGuildMutation() {
    return useMutation({
        mutationFn: (guildId: string) => leaveGuild(guildId),
        onSuccess: (response, guildId) => {
            if (!response.success) throw new Error(response.message as string);

            const { removeGuild } = useGuildsStore.getState();
            removeGuild(guildId);
        }
    });
}

export function useAssignRoleMembers() {
    return useMutation({
        mutationFn: (dto: AssignRoleDTO) => assignRoleMembers(dto),
        onSuccess: (response, dto) => {
            if (!response.success) throw new Error(response.message as string);

            const { upsertMember } = useGuildsStore.getState();


            for (const member of response.data!) upsertMember(dto.guildId, member)
        }
    })
}

export function useCreateRole(guildId: string) {
    return useMutation({
        mutationFn: () => createRole(guildId),
        onSuccess: (response) => {
            if (!response.success) return;
            const { upsertRole } = useGuildsStore.getState();
            upsertRole(guildId, response.data!);
        }
    })
}

export function useUpdateMember() {
    return useMutation({
        mutationFn: (dto: UpdateMemberDTO) => updateMember(dto),
        onSuccess: (response, dto) => {
            if (!response.success) throw new Error(response.message as string);

            const { upsertMember } = useGuildsStore.getState();

            upsertMember(dto.guildId, response.data!);
        }
    })
}

export function useUpdateRole() {
    return useMutation({
        mutationFn: (dto: Role) => updateRole(dto),
        onSuccess: (response, dto) => {
            if (!response.success) throw new Error(response.message as string);

            const { upsertRole } = useGuildsStore.getState();
            upsertRole(dto.guildId, response.data!);
        }
    })
}

export function useUpdatePermissionOverwrite(parentId?: string) {
    return useMutation({
        mutationFn: (dto: updatePermissionOverwriteDTO) => updatePermissionOverwrite(dto),
        onSuccess: (response, dto) => {
            if (!response.success) throw new Error(response.message as string);

            const overwrite = response.data!;
            const { upsertChannel: updateChannel, getChannel } = useGuildsStore.getState();
            const channel = getChannel(dto.channelId);
            const parent = parentId ? getChannel(parentId) : undefined;
            if (!channel) return;

            if (channel.isSynced && channel.parent) {
                channel.isSynced = false;
                channel.permissionOverwrites = parent!.permissionOverwrites;
            }
            const oldOverwrites = channel.permissionOverwrites;
            if (oldOverwrites.find(ow => ow.targetId === overwrite.targetId)) {
                channel.permissionOverwrites = oldOverwrites.map(ow => ow.targetId !== overwrite!.targetId ? ow : response.data!);
            }
            else {
                channel.permissionOverwrites = [...oldOverwrites, overwrite]
            }
            updateChannel(channel.guildId, channel.id, channel);
        }
    })
}

export function useSyncChannel() {
    return useMutation({
        mutationFn: (channelId: string) => syncChannel(channelId),
        onSuccess: (response, channelId) => {
            if (!response.success) throw new Error(response.message as string);

            const { upsertChannel: updateChannel, getChannel } = useGuildsStore.getState();
            const channel = getChannel(channelId);
            if (!channel) return;

            updateChannel(channel.guildId, channel.id, response.data!);
        }
    });
}

export function useDeletePermissionOverwrite() {
    return useMutation({
        mutationFn: ({ channelId, targetId }: { channelId: string, targetId: string }) => deletePermissionOverwrite(channelId, targetId),
        onSuccess: (response, dto) => {
            if (!response.success) throw new Error(response.message as string);

            const { upsertChannel: updateChannel, getChannel } = useGuildsStore.getState();
            const channel = getChannel(dto.channelId);
            if (!channel) return;

            const oldOverwrites = channel.permissionOverwrites;
            channel.permissionOverwrites = oldOverwrites.filter(ow => ow.targetId !== dto.targetId);
            updateChannel(channel.guildId, channel.id, channel);
        }
    });
}

export function useUpdateGuildMutation() {
    return useMutation({
        mutationFn: (dto: UpdateGuildDTO) => updateGuild(dto),
        onSuccess: (response, dto) => {
            if (!response.success) throw new Error(response.message as string);

            const { upsertGuild } = useGuildsStore.getState();

            upsertGuild(response.data!);
        }
    });
}

export function useDeleteRoleMutation() {
    return useMutation({
        mutationFn: (dto: DeleteRoleDTO) => deleteRole(dto),
        onSuccess: (response, dto) => {
            if (!response.success) throw new Error(response.message as string);

            const { removeRole } = useGuildsStore.getState();

            removeRole(dto.guildId, dto.roleId);
        }
    });
}
