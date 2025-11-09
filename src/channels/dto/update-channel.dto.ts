import { AutoMap } from "@automapper/classes";

export class UpdateChannelDTO {
    @AutoMap()
    channelId: string;
    @AutoMap()
    name: string;
}