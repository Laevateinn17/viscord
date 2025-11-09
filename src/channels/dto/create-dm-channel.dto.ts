import { AutoMap } from "@automapper/classes";

export class CreateDMChannelDTO {
    @AutoMap()
    recipientId: string
}