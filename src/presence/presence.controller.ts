import { Body, Controller, forwardRef, Inject, ValidationPipe } from '@nestjs/common';
import { MessagePattern } from "@nestjs/microservices";
import { USER_PRESENCE_UPDATE_EVENT } from "src/constants/events";
import { Payload } from "src/interfaces/payload.dto";
import { WsGateway } from "src/ws/ws.gateway";
import { UserPresenceUpdateDTO } from "./dto/user-presence-update.dto";

@Controller('presence')
export class PresenceController {
    constructor(
        @Inject(forwardRef(() => WsGateway)) private readonly gateway: WsGateway
    ) {
    }

    @MessagePattern(USER_PRESENCE_UPDATE_EVENT)
    async handleUserOnline(@Body(new ValidationPipe({ transform: true })) dto: Payload<UserPresenceUpdateDTO>) {
        console.log('received presence update event', dto);
        await this.gateway.handleBroadcastPresenceUpdate(dto);
    }

}
