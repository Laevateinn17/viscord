import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, ValidationPipe, Res, HttpStatus } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDTO } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateDMChannelDTO } from "./dto/create-dm-channel.dto";
import { Response } from "express";
import { GrpcMethod, MessagePattern } from "@nestjs/microservices";
import { AcknowledgeMessageDTO } from "./dto/acknowledge-message.dto";
import { CREATE_PRODUCER, CREATE_RTC_ANSWER, CREATE_RTC_OFFER, CREATE_TRANSPORT, GET_VOICE_RINGS_EVENT, GET_VOICE_STATES_EVENT, PRODUCER_CREATED, VOICE_UPDATE_EVENT } from "src/constants/events";
import { VoiceEventDTO } from "./dto/voice-event.dto";
import { RedisService } from "src/redis/redis.service";
import { VoiceEventType } from "./enums/voice-event-type";
import { RTCOfferDTO } from "./dto/rtc-offer.dto";
import { ProducerCreatedDTO } from "./dto/producer-created.dto";
import { GetDMChannelsDTO } from "./dto/get-dm-channels.dto";

@Controller('guilds/:guildId/channels')
export class GuildChannelsController {
  constructor(
    private readonly channelsService: ChannelsService) { }

  @Post()
  async create(@Headers('X-User-Id') userId: string, @Body() createChannelDto: CreateChannelDTO, @Res() res: Response, @Param('guildId') guildId: string) {
    createChannelDto.guildId = guildId;
    const result = await this.channelsService.create(userId, createChannelDto);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Get()
  findAll() {

  }

  @Get(':id')
  findOne(@Param('id') id: string) {
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
  }
}

@Controller('users/me/channels')
export class DMChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Post()
  async create(@Headers('X-User-Id') userId: string, @Body(new ValidationPipe({ transform: true })) dto: CreateDMChannelDTO, @Res() res: Response) {
    if (!userId || userId.length === 0) {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }

    const result = await this.channelsService.createDMChannel(userId, dto);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Get()
  async getAll(@Headers('X-User-Id') userId: string, @Res() res: Response) {
    const result = await this.channelsService.getDMChannels(userId);
    const { status } = result;

    return res.status(status).json(result);
  }

  @GrpcMethod('ChannelsService', 'GetDMChannels')
  async acknowledgeMessage(dto: GetDMChannelsDTO) {
    return this.channelsService.getDMChannels(dto.userId);
  }

  @Get(':channelId')
  async getDMChannel(@Headers('X-User-Id') userId: string, @Param('channelId') channelId: string, @Res() res: Response) {
    if (!userId || userId.length === 0) {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }

    const result = await this.channelsService.getChannelDetail(userId, channelId);
    const { status } = result;

    return res.status(status).json(result);
  }
}

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Get(':channelId')
  async getDMChannel(@Headers('X-User-Id') userId: string, @Param('channelId') channelId: string, @Res() res: Response) {
    if (!userId || userId.length === 0) {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }

    const result = await this.channelsService.getChannelDetail(userId, channelId);
    const { status } = result;
    return res.status(status).json(result);
  }

  @Post(':channelId/typing')
  async broadcastUserTyping(@Headers('X-User-Id') userId: string, @Param('channelId') channelId: string, @Res() res: Response) {
    if (!userId || userId.length === 0) {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }

    const result = await this.channelsService.broadcastUserTyping(userId, channelId);
    const { status } = result;
    return res.status(status).json(result);
  }

  @GrpcMethod('ChannelsService', 'AcknowledgeMessage')
  async acknowledgeMessage(dto: AcknowledgeMessageDTO) {
    return this.channelsService.acknowledgeMessage(dto);
  }

  @Post(':channelId/call/ring')
  async ringChannelRecipients(@Headers('X-User-Id') userId: string, @Param('channelId') channelId: string, @Res() res: Response) {
    if (!userId || userId.length === 0) {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }

    const result = await this.channelsService.ringChannelRecipients(userId, channelId);
    const { status } = result;

    return res.status(status).json(result);
  }

  @MessagePattern(VOICE_UPDATE_EVENT)
  async voiceUpdate(@Body(new ValidationPipe({ transform: true })) dto: VoiceEventDTO) {
    switch (dto.type) {
      case VoiceEventType.VOICE_JOIN: await this.channelsService.handleVoiceJoin(dto); break;
      case VoiceEventType.VOICE_LEAVE: await this.channelsService.handleVoiceLeave(dto); break;
      case VoiceEventType.STATE_UPDATE: await this.channelsService.handleVoiceStateUpdate(dto); break;
    }
  }

  @MessagePattern(GET_VOICE_STATES_EVENT)
  async getVoiceStates(@Body(new ValidationPipe({ transform: true })) userId: string) {
    await this.channelsService.handleGetVoiceStates(userId);
  }

  @MessagePattern(GET_VOICE_RINGS_EVENT)
  async getVoiceRingStates(@Body(new ValidationPipe({ transform: true })) userId: string) {
    await this.channelsService.handleGetVoiceRings(userId);
  }


}