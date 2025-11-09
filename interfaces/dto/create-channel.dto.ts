import { ChannelType } from "@/enums/channel-type.enum";

export interface CreateChannelDTO {
    guildId: string;
    name: string;
    type: ChannelType;
    isPrivate: boolean;
    parentId?: string;
}