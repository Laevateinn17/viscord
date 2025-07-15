import { Body, Controller, Get, Inject, ValidationPipe } from '@nestjs/common';
import { EventPattern, MessagePattern } from "@nestjs/microservices";
import { FRIEND_ADDED_EVENT, FRIEND_REMOVED_EVENT, FRIEND_REQUEST_RECEIVED_EVENT, GET_USERS_STATUS_EVENT, GET_USERS_STATUS_RESPONSE_EVENT, USER_OFFLINE_EVENT, USER_ONLINE_EVENT } from "src/constants/events";
import { RelationshipResponseDTO } from "./dto/relationship-response.dto";
import { Payload } from "src/ws/dto/payload.dto";
import { WsGateway } from "src/ws/ws.gateway";

@Controller('/ws/relationships')
export class RelationshipsController {

    constructor(
        private readonly gateway: WsGateway
    ) {
    }

    @Get()
    hello() {
        console.log("test");
        return "Hello";
    }

    @MessagePattern(FRIEND_REQUEST_RECEIVED_EVENT)
    async handleFriendRequestReceived(@Body(new ValidationPipe({ transform: true })) dto: Payload<RelationshipResponseDTO>) {
        console.log("received friend request", dto);
        this.gateway.handleFriendReceived(dto);
    }

    @MessagePattern(FRIEND_ADDED_EVENT)
    async handleFriendAdded(@Body(new ValidationPipe({ transform: true })) dto: Payload<RelationshipResponseDTO>) {
        console.log("friend added", dto);
        this.gateway.handleFriendAdded(dto);
    }

    @MessagePattern(FRIEND_REMOVED_EVENT)
    async handleFriendRemoved(@Body(new ValidationPipe({ transform: true })) dto: Payload<RelationshipResponseDTO>) {
        console.log("\n\n\nfriend removed", dto);
        this.gateway.handleFriendRemoved(dto);
    }

    @MessagePattern(USER_ONLINE_EVENT)
    async handleUserOnline(@Body(new ValidationPipe({ transform: true })) dto: Payload<string>) {
        console.log("USER ONLINE", dto.recipients)
        this.gateway.handleUserOnline(dto);
    }

    @MessagePattern(USER_OFFLINE_EVENT)
    async handleUserOffline(@Body(new ValidationPipe({ transform: true })) dto: Payload<string>) {
        console.log("USER OFFLINE", dto.recipients)
        this.gateway.handleUserOffline(dto);
    }
}
