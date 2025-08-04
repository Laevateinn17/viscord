import { UserProfileResponseDTO } from "src/user-profiles/dto/user-profile-response.dto";
import { ChannelRecipient } from "../entities/channel-recipient.entity";
import { AutoMap } from "@automapper/classes";
import { Channel } from "../entities/channel.entity";
import { ChannelType } from "../enums/channel-type.enum";
import { Guild } from "src/guilds/entities/guild.entity";

export class ChannelResponseDTO {
    @AutoMap()
    id: string;

    @AutoMap()
    name?: string;

    @AutoMap()
    type: ChannelType;

    @AutoMap()
    isPrivate: boolean

    @AutoMap()
    createdAt: Date;

    @AutoMap()
    updatedAt: Date;

    @AutoMap()
    parent?: ChannelResponseDTO;

    @AutoMap()
    guild?: Guild;

    recipients: UserProfileResponseDTO[];

    lastReadId?: string;
}