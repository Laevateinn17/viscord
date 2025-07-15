import { Body, Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern } from "@nestjs/microservices";
import { USER_TYPING_EVENT } from "src/constants/events";
import { UserTypingDTO } from "./dto/user-typing.dto";
import { Payload } from "src/ws/dto/payload.dto";
import { WsGateway } from "src/ws/ws.gateway";

@Controller('guilds')
export class GuildsController {
    constructor(
        private readonly gateway: WsGateway
    ) {
    }

    @MessagePattern(USER_TYPING_EVENT)
    async handleBroadcastUserTyping(@Body(new ValidationPipe({ transform: true })) dto: Payload<UserTypingDTO>) {
        this.gateway.handleBroadcastUserTyping(dto);
    }
}
