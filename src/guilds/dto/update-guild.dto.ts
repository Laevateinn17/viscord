import { AutoMap } from "@automapper/classes";

export class UpdateGuildDTO {
    userId: string;
    guildId: string;
    @AutoMap()
    name: string;
}