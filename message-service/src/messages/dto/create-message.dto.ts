import { AutoMap } from "@automapper/classes";
import { AutomapperModule } from "@automapper/nestjs";

export class CreateMessageDto {
    @AutoMap()
    content: string;

    @AutoMap()
    channelId: string

    @AutoMap()
    mentions: string[]

    @AutoMap()
    senderId: string

    @AutoMap()
    attachments: Express.Multer.File[]
}
