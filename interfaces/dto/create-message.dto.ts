
export interface CreateMessageDto {
    content: string
    channelId: string
    mentions: string[]
    attachments: File[]
}
