import { AutoMap } from "@automapper/classes";
import { UserProfileResponseDTO } from "src/user-profiles/dto/user-profile-response.dto";
import { ChannelType } from "./enums/channel-type.enum";

export class ChannelResponseDTO {
    @AutoMap()
    id: string;

    @AutoMap()
    name?: string;

    @AutoMap()
    isPrivate: boolean

    @AutoMap()
    createdAt: Date;

    @AutoMap()
    updatedAt: Date;

    @AutoMap()
    parent?: ChannelResponseDTO;

    @AutoMap()
    type: ChannelType;

    @AutoMap()
    guildId: string;

    @AutoMap()
    recipients: UserProfileResponseDTO[];

    @AutoMap()
    lastMessageId?: string;
}