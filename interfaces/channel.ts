import { ChannelType } from "@/enums/channel-type.enum";
import { Guild } from "./guild";
import { UserProfile } from "./user-profile";
import { UserChannelState } from "./user-channel-state";
import { PermissionOverwrite } from "./permission-ovewrite";

export interface Channel {
    id: string;
    name?: string;
    type: ChannelType;
    isPrivate: boolean
    createdAt: Date;
    updatedAt: Date;
    parent?: Channel;
    guildId: string;
    recipients?: UserProfile[];
    lastMessageId?: string;
    userChannelState: UserChannelState;
    permissionOverwrites: PermissionOverwrite[];
}