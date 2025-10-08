import { Body, Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern } from "@nestjs/microservices";
import { GUILD_UPDATE_EVENT, USER_TYPING_EVENT } from "src/constants/events";
import { UserTypingDTO } from "./dto/user-typing.dto";
import { Payload } from "src/interfaces/payload.dto";
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

    @MessagePattern(GUILD_UPDATE_EVENT)
    async handleGuildUpdate(@Body(new ValidationPipe({transform: true})) dto: Payload<any>) {
        console.log('guild update', dto)
        this.gateway.handleGuildUpdate(dto);
    }
}
