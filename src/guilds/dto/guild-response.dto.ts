import { AutoMap } from "@automapper/classes";
import { GuildMember } from "../entities/guild-members.entity";
import { Channel } from "src/channels/entities/channel.entity";
import { ChannelResponseDTO } from "src/channels/dto/channel-response.dto";
import { UserProfileResponseDTO } from "src/user-profiles/dto/user-profile-response.dto";

export class GuildResponseDTO {
    @AutoMap()
    id: string;

    @AutoMap()
    name: string;

    @AutoMap()
    ownerId: string;

    @AutoMap()
    iconURL?: string;

    @AutoMap()
    channels: ChannelResponseDTO[]

    @AutoMap()
    createdAt: Date

    @AutoMap()
    updatedAt: Date

    @AutoMap()
    members: UserProfileResponseDTO[];
}