import { AutoMap } from "@automapper/classes";

export class UserChannelStateResponseDTO {

    @AutoMap()
    lastReadId?: string;

    @AutoMap()
    unreadCount: number;

    @AutoMap()
    mentionCount: number;
}