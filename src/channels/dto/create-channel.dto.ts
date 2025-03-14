import { AutoMap } from "@automapper/classes";
import { ChannelType } from "../enums/channel-type.enum";

export class CreateChannelDTO {
    @AutoMap()
    guildId: string

    @AutoMap()
    name: string;

    @AutoMap()
    type: ChannelType

    @AutoMap()
    parentId?: string
}
