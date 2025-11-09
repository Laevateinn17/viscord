import { AutoMap } from "@automapper/classes"
import { AttachmentResponseDTO } from "./attachment-response.dto"

export class MessageResponseDTO {
    @AutoMap()
    id: string

    @AutoMap()
    senderId: string

    @AutoMap()
    content: string

    @AutoMap()
    channelId: string

    @AutoMap()
    is_pinned: boolean

    @AutoMap()
    createdAt: Date

    @AutoMap()
    updatedAt: Date


    @AutoMap()
    mentions: string[]

    attachments: AttachmentResponseDTO[]
}