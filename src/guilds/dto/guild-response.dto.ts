import { AutoMap } from "@automapper/classes";
import { ChannelResponseDTO } from "src/channels/dto/channel-response.dto";
import { RoleResponseDTO } from "src/guilds/dto/role-response.dto";
import { GuildMemberResponseDTO } from "./guild-member-response.dto";

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

    members: GuildMemberResponseDTO[];

    @AutoMap()
    roles: RoleResponseDTO[];
}