import { MessageResponseDTO } from "src/messages/dto/message-response.dto";

export class MessageCreatedDTO {
    channelId: string;
    message: MessageResponseDTO;
}