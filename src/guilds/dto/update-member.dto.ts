import { AutoMap } from "@automapper/classes";

export class UpdateMemberDTO {
    @AutoMap()
    userId: string;
    @AutoMap()
    memberId: string;
    @AutoMap()
    guildId: string;
    @AutoMap()
    roleIds: string[];
}