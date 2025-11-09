import { GuildUpdateType } from "@/enums/guild-update-type.enum";

export interface GuildUpdateDTO {
    guildId: string;
    type: GuildUpdateType;
    data: any;
}