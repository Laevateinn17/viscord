import { UserProfileResponseDTO } from "src/user-profiles/dto/user-profile-response.dto";
import { AutoMap } from "@automapper/classes";
import { ChannelType } from "../enums/channel-type.enum";
import { UserChannelStateResponseDTO } from "./user-channel-state-response.dto";
import { PermissionOverwriteResponseDTO } from "./permission-overwrite-response.dto";

export class ChannelResponseDTO {
    @AutoMap()
    id: string;

    @AutoMap()
    name?: string;

    @AutoMap()
    type: ChannelType;

    @AutoMap()
    createdAt: Date;

    @AutoMap()
    updatedAt: Date;

    @AutoMap()
    parent?: ChannelResponseDTO;

    @AutoMap()
    guildId: string;

    @AutoMap()
    recipients: UserProfileResponseDTO[];

    @AutoMap()
    lastMessageId?: string;

    @AutoMap()
    userChannelState?: UserChannelStateResponseDTO;

    @AutoMap()
    permissionOverwrites: PermissionOverwriteResponseDTO[];
}