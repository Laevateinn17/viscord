import { AutoMap } from "@automapper/classes";
import { PermissionOverwriteTargetType } from "../enums/permission-overwrite-target-type.enum";

export class PermissionOverwriteResponseDTO {
    @AutoMap()
    allow: string;

    @AutoMap()
    deny: string;

    @AutoMap()
    targetId: string;

    @AutoMap()
    targetType: PermissionOverwriteTargetType;

    @AutoMap()
    channelId: string;

}