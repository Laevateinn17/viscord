import { AutoMap } from "@automapper/classes";

export class CreateInviteDto {
    @AutoMap()
    inviterId: string;

    @AutoMap()
    channelId: string;

    @AutoMap()
    guildId: string;

    @AutoMap()
    maxAge: number;
}
