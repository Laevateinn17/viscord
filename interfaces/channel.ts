import { ChannelType } from "@/enums/channel-type.enum";
import { Guild } from "./guild";
import { UserProfile } from "./user-profile";

export interface Channel {
    id: string;
    name?: string;
    type: ChannelType;
    isPrivate: boolean
    createdAt: Date;
    updatedAt: Date;
    parent?: Channel;
    guild?: Guild;
    recipients: UserProfile[]
    lastReadId?: string
}