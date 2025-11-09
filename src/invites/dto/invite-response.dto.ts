import { AutoMap } from "@automapper/classes";

export class InviteResponseDTO {
    @AutoMap()
    id: string;

    @AutoMap()
    code: string;

    @AutoMap()
    maxAge: number;

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