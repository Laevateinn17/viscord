import { AutoMap } from "@automapper/classes";

export class RoleResponseDTO {
    @AutoMap()
    id: string;

    @AutoMap()
    name: string

    @AutoMap()
    permissions: string;

    @AutoMap()
    position: number;

    @AutoMap()
    isHoisted: boolean;

    @AutoMap()
    color: number;

    @AutoMap()
    guildId: string;
}