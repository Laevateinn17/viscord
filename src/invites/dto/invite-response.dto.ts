import { AutoMap } from "@automapper/classes";

export class InviteResponseDTO {
    @AutoMap()
    id: string;

    @AutoMap()
    code: string;

    @AutoMap()
    inviterId: string;

    @AutoMap()
    channelId: string;
    
    @AutoMap()
    guildId?: string;

    @AutoMap()
    createdAt: string;

    @AutoMap()
    expiresAt: string;
}