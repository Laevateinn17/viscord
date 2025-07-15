import { Body, Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern } from "@nestjs/microservices";
import { USER_STATUS_UPDATE_EVENT } from "src/constants/events";
import { UserStatusUpdateDTO } from "./dto/user-status-update.dto";
import { Payload } from "src/ws/dto/payload.dto";
import { WsGateway } from "src/ws/ws.gateway";

@Controller('user-profiles')
export class UserProfilesController {

    constructor(
        private readonly gateway: WsGateway
    ) {
    }


    @MessagePattern(USER_STATUS_UPDATE_EVENT)
    async handleFriendAdded(@Body(new ValidationPipe({ transform: true })) dto: Payload<UserStatusUpdateDTO>) {
        this.gateway.handleUserStatusUpdate(dto);
    }
}
