import { Controller } from '@nestjs/common';
import { EventPattern } from "@nestjs/microservices";
import { MESSAGE_RECEIVED_EVENT } from "src/constants/events";
import { Payload } from "src/interfaces/payload.dto";
import { WsGateway } from "src/ws/ws.gateway";

@Controller('/ws/messages')
export class MessagesController {
    constructor(
         private readonly gateway: WsGateway
    ) {
        console.log("\n\n\nMESSAGE CONTROLLER\n\n\n");
    }

    @EventPattern(MESSAGE_RECEIVED_EVENT)
    async handleMessageReceived(payload: Payload<any>) {
        console.log('message receivedddd', payload);
        this.gateway.handleMessageReceived(payload);
    }
}
