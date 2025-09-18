import { Body, Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern } from "@nestjs/microservices";
import { GET_USERS_PRESENCE_RESPONSE_EVENT } from "src/constants/events";
import { Payload } from "src/interfaces/payload.dto";
import { WsGateway } from "src/ws/ws.gateway";

@Controller('presence')
export class PresenceController {
}
