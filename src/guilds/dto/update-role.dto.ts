import { AutoMap } from "@automapper/classes";
import { StartSingleWirelessDeviceImportTaskRequest } from "aws-sdk/clients/iotwireless";

export class UpdateRoleDTO {
    @AutoMap()
    id: string;
    @AutoMap()
    name: string;
    @AutoMap()
    position: number;
    @AutoMap()
    permissions: bigint;
    @AutoMap()
    isHoisted: boolean;
    @AutoMap()
    color?: number;
    @AutoMap()
    guildId: string;
    @AutoMap()
    userId: string;
}