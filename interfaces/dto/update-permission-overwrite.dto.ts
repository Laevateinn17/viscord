import { PermissionOverwriteTargetType } from "@/enums/permission-overwrite-target-type.enum";

export interface updatePermissionOverwriteDTO {
    allow: string;
    deny: string;
    targetId: string;
    targetType: PermissionOverwriteTargetType;
    channelId: string;
}