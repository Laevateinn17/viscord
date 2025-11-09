import { PermissionOverwriteTargetType } from "../enums/permission-overwrite-target-type.enum";

export class UpdateChannelPermissionOverwriteDTO {
    userId: string;
    targetId: string;
    channelId: string;
    targetType: PermissionOverwriteTargetType;
    allow: bigint;
    deny: bigint;
}