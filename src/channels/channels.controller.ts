import { Body, Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern } from "@nestjs/microservices";
import { CREATE_RTC_ANSWER, CREATE_RTC_OFFER, CREATE_SEND_TRANSPORT, GET_VOICE_RINGS_EVENT, GET_VOICE_STATES_EVENT, PRODUCER_CREATED, VOICE_RING_DISMISS_EVENT, VOICE_RING_EVENT, VOICE_UPDATE_EVENT } from "src/constants/events";
import { UserTypingDTO } from "src/guilds/dto/user-typing.dto";
import { Payload } from "src/ws/dto/payload.dto";
import { WsGateway } from "src/ws/ws.gateway";
import { VoiceEventDTO } from "./dto/voice-event.dto";

@Controller('channels')
export class ChannelsController {
    constructor(
        private readonly gateway: WsGateway
    ) {
    }

    @MessagePattern(VOICE_RING_EVENT)
    async handleRingChannelRecipients(@Body(new ValidationPipe({ transform: true })) dto: Payload<VoiceEventDTO>) {
        this.gateway.handleRingChannelRecipients(dto);
    }

    @MessagePattern(VOICE_UPDATE_EVENT)
    async handleVoiceStateUpdate(@Body(new ValidationPipe({ transform: true })) dto: Payload<VoiceEventDTO>) {
        this.gateway.handleVoiceStateUpdate(dto);
    }

    @MessagePattern(GET_VOICE_STATES_EVENT) 
    async handleGetVoiceStates(@Body(new ValidationPipe({ transform: true })) dto: Payload<any>) {
        this.gateway.handleGetVoiceStates(dto);
    }

    @MessagePattern(VOICE_RING_EVENT)
    async handleVoiceRing(@Body(new ValidationPipe({ transform: true })) dto: Payload<any>) {
        this.gateway.handleVoiceRing(dto);
    }

    @MessagePattern(GET_VOICE_RINGS_EVENT)
    async handleVoicegetVoiceRings(@Body(new ValidationPipe({ transform: true })) dto: Payload<any>) {
        this.gateway.handleGetVoiceRings(dto);
    }

    @MessagePattern(VOICE_RING_DISMISS_EVENT)
    async handleVoiceRingDismiss(@Body(new ValidationPipe({ transform: true })) dto: Payload<any>) {
        this.gateway.handleVoiceRingDismiss(dto);
    }

    @MessagePattern(CREATE_RTC_OFFER) 
    async handleRTCOfferCreated(@Body(new ValidationPipe({ transform: true })) dto: Payload<any>) {
        this.gateway.handleBroadcastRTCOffer(dto)
    }
    
    @MessagePattern(CREATE_RTC_ANSWER) 
    async handleRTCAnswerCreated(@Body(new ValidationPipe({ transform: true })) dto: Payload<any>) {
        this.gateway.handleBroadcastRTCAnswer(dto)
    }

    @MessagePattern(PRODUCER_CREATED)
    async handleBroadcastProducerCreated(@Body(new ValidationPipe({ transform: true })) dto: Payload<any>) {
        this.gateway.handleBroadcastProducerCreated(dto);
    }
}
