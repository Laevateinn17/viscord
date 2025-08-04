import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateChannelDTO } from './dto/create-channel.dto';
import { CreateDMChannelDTO } from "./dto/create-dm-channel.dto";
import { Result } from "src/interfaces/result.interface";
import { ChannelResponseDTO } from "./dto/channel-response.dto";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";
import { Not, Repository } from "typeorm";
import { Channel } from "./entities/channel.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ChannelRecipient } from "./entities/channel-recipient.entity";
import { mapper } from "src/mappings/mappers";
import { createMap } from "@automapper/core";
import { ChannelType } from "./enums/channel-type.enum";
import { response } from "express";
import { UserProfileResponseDTO } from "src/user-profiles/dto/user-profile-response.dto";
import { UserProfile } from "aws-sdk/clients/opsworks";
import { ClientProxy, ClientProxyFactory, GrpcMethod, Transport } from "@nestjs/microservices";
import { CREATE_CONSUMER, CREATE_PRODUCER, CREATE_RTC_ANSWER, CREATE_RTC_OFFER, CREATE_TRANSPORT, GATEWAY_QUEUE, GET_VOICE_RINGS_EVENT, GET_VOICE_STATES_EVENT, PRODUCER_CREATED, USER_TYPING_EVENT, VOICE_RING_DISMISS_EVENT, VOICE_RING_EVENT, VOICE_UPDATE_EVENT } from "src/constants/events";
import { Payload } from "src/interfaces/payload.dto";
import { UserTypingDTO } from "src/channels/dto/user-typing.dto";
import { UserReadState } from "./entities/user-read-state.entity";
import { AcknowledgeMessageDTO } from "./dto/acknowledge-message.dto";
import { VoiceEventDTO } from "./dto/voice-event.dto";
import { RedisService } from "src/redis/redis.service";
import { VoiceState } from "./entities/voice-state";
import { VoiceEventType } from "./enums/voice-event-type";
import { VoiceStateDTO } from "./dto/voice-state.dto";
import { VoiceRingState } from "./entities/voice-ring-state";
import { VOICE_RING_TIMEOUT } from "src/constants/time";
import { VoiceRingStateDTO } from "./dto/voice-ring-state.dto";
import { RTCOfferDTO } from "./dto/rtc-offer.dto";
import { SfuService } from "src/sfu/sfu.service";
import { ProducerCreatedDTO } from "./dto/producer-created.dto";

@Injectable()
export class ChannelsService {
  private gatewayMQ: ClientProxy;

  constructor(
    private readonly usersService: HttpService,
    private readonly redisService: RedisService,
    private readonly sfuService: SfuService,
    @InjectRepository(Channel) private readonly channelsRepository: Repository<Channel>,
    @InjectRepository(ChannelRecipient) private readonly channelRecipientRepository: Repository<ChannelRecipient>,
    @InjectRepository(UserReadState) private readonly userReadStateRepository: Repository<UserReadState>
  ) {
    this.gatewayMQ = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
        queue: GATEWAY_QUEUE,
        queueOptions: { durable: true }
      }
    });
  }

  async create(userId: string, dto: CreateChannelDTO): Promise<Result<ChannelResponseDTO>> {
    if (!dto.guildId || dto.guildId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid guild id'
      };
    }

    const channel = mapper.map(dto, CreateChannelDTO, Channel);
    channel.ownerId = userId;

    try {
      await this.channelsRepository.save(channel);
    } catch (error) {
      console.error(error)
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'An unknown error occurred when creating channel'
      };
    }

    return {
      status: HttpStatus.CREATED,
      data: mapper.map(channel, Channel, ChannelResponseDTO),
      message: 'Channel created successfully'
    };
  }

  async createDMChannel(userId: string, dto: CreateDMChannelDTO): Promise<Result<ChannelResponseDTO>> {
    if (!dto.recipientId || dto.recipientId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "Recipient is empty"
      };
    }

    let existingChannel = await this.channelsRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.recipients', 'channel_recipient')
      .where('channel_recipient.user_id IN (:...recipients) AND channel.type = :channelType', { recipients: [userId, dto.recipientId], channelType: ChannelType.DM })
      .having('COUNT(DISTINCT channel_recipient.user_id) = 2')
      .groupBy('channel.id')
      .select('channel.id').getOne();

    if (existingChannel) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "Channel already exists"
      }
    }


    let recipientResponse: Result<any>;

    try {
      const url = `http://${process.env.USER_SERVICE_HOST}:${process.env.USER_SERVICE_PORT}/user-profiles/${dto.recipientId}`;
      recipientResponse = (await firstValueFrom(this.usersService.get(url))).data;
      if (recipientResponse.status !== HttpStatus.OK) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: null,
          message: "Failed retrieving recipient data"
        };
      }
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "Failed retrieving recipient data"
      };
    }

    const channel = mapper.map(dto, CreateDMChannelDTO, Channel);
    channel.type = ChannelType.DM;
    channel.ownerId = userId;

    try {
      await this.channelsRepository.save(channel);
      const recipients: ChannelRecipient[] = [{ channelId: channel.id, userId: userId }, { channelId: channel.id, userId: dto.recipientId }];
      await this.channelRecipientRepository.save(recipients);

      channel.recipients = recipients;
    } catch (error) {
      console.error(error)
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: "Failed saving channel data"
      };
    }

    const responseDTO = mapper.map(channel, Channel, ChannelResponseDTO);
    responseDTO.recipients = [recipientResponse.data];

    return {
      status: HttpStatus.CREATED,
      data: responseDTO,
      message: ""
    };

  }

  async getDMChannels(userId: string): Promise<Result<ChannelResponseDTO[]>> {
    let channels: Channel[] = [];

    try {
      channels = await this.channelsRepository
        .createQueryBuilder('channel')
        .innerJoin('channel.recipients', 'channel_recipient')
        .where('channel_recipient.user_id = :userId AND channel.type = :channelType', { userId: userId, channelType: ChannelType.DM })
        .select('channel').getMany();
    } catch (error) {
      console.log(error)
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: "Failed retrieving DMs"
      };
    }

    const dto: ChannelResponseDTO[] = channels.map(channel => mapper.map(channel, Channel, ChannelResponseDTO));

    for (const channel of dto) {
      const recipients = await this.channelRecipientRepository.findBy({ channelId: channel.id });
      const readState = await this.userReadStateRepository.findOneBy({ userId: userId, channelId: channel.id });
      if (readState) channel.lastReadId = readState.lastMessageId;
      channel.recipients = await Promise.all(recipients.filter(re => re.userId !== userId).map(async r => {
        const response = await this.getRecipientDetail(r.userId);
        if (response.status !== HttpStatus.OK) {
          return undefined;
        }
        return response.data!;
      }));
    }


    return {
      status: HttpStatus.OK,
      data: dto,
      message: 'DM Channels retrieved successfully'
    };
  }

  async getGuildChannels(guildId: string): Promise<Result<ChannelResponseDTO[]>> {
    if (!guildId || guildId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid guild id'
      };
    }

    const channels = await this.channelsRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.parent', 'channel')
      .where('channel.guildId = :guildId', { guildId: guildId })
      .getMany();

    const data = channels.map(ch => mapper.map(ch, Channel, ChannelResponseDTO));

    return {
      status: HttpStatus.OK,
      data: data,
      message: 'Channels retrieved successfully'
    };
  }

  async getChannelDetail(userId: string, channelId: string): Promise<Result<ChannelResponseDTO>> {
    if (!channelId || channelId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid channel id'
      };
    }

    const channel = await this.channelsRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.recipients', 'recipients')
      .where('channel.id = :channelId', { channelId: channelId })
      .getOne();

    if (!channel) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Channel not found'
      };
    }

    if (!channel.recipients.find(r => r.userId === userId)) {
      return {
        status: HttpStatus.FORBIDDEN,
        data: null,
        message: 'User is not part of this channel'
      };
    }

    const data = mapper.map(channel, Channel, ChannelResponseDTO);
    data.recipients = await Promise.all(channel.recipients.filter(re => re.userId !== userId).map(async r => (await this.getRecipientDetail(r.userId)).data));

    return {
      status: HttpStatus.OK,
      data: data,
      message: 'Channel retrieved successfully'
    };
  }

  private async getRecipientDetail(userId: string): Promise<Result<UserProfileResponseDTO>> {
    let recipientResponse: AxiosResponse<UserProfileResponseDTO, any>;
    try {
      const url = `http://${process.env.USER_SERVICE_HOST}:${process.env.USER_SERVICE_PORT}/user-profiles/${userId}`;
      recipientResponse = (await firstValueFrom(this.usersService.get(url))).data;
      if (recipientResponse.status !== HttpStatus.OK) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: null,
          message: 'Failed retrieving recipient data'
        };
      }
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Failed retrieving recipient data'
      };
    }

    return {
      status: HttpStatus.OK,
      data: recipientResponse.data,
      message: 'Recipient data retrieved successfully'
    }
  }

  async broadcastUserTyping(userId: string, channelId: string): Promise<Result<null>> {
    const recipients = await this.channelRecipientRepository.findBy({ channelId: channelId, userId: Not(userId) });
    const dto: UserTypingDTO = {
      userId: userId,
      channelId: channelId
    };

    try {
      this.gatewayMQ.emit(USER_TYPING_EVENT, { recipients: recipients.map(r => r.userId), data: dto } as Payload<UserTypingDTO>)
    } catch (error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'An error occurred while broadcasting typing status'
      };
    }

    return {
      status: HttpStatus.NO_CONTENT,
      data: null,
      message: ''
    };
  }

  async acknowledgeMessage(dto: AcknowledgeMessageDTO): Promise<Result<null>> {
    let userReadState = await this.userReadStateRepository.findOne({ where: { userId: dto.userId, channelId: dto.channelId } })

    if (!userReadState) {
      userReadState = this.userReadStateRepository.create()
      userReadState.channelId = dto.channelId;
      userReadState.userId = dto.userId;
    }
    userReadState.lastMessageId = dto.messageId;

    try {
      await this.userReadStateRepository.save(userReadState);
    } catch (error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'An error occurred while updating last seen message'
      };
    }

    return {
      status: HttpStatus.NO_CONTENT,
      message: 'Last seen message updated successfully',
      data: null
    };
  }

  async ringChannelRecipients(userId: string, channelId: string): Promise<Result<null>> {
    const channel = await this.channelsRepository
      .createQueryBuilder('channel')
      .innerJoinAndSelect('channel.recipients', 'channel_recipient')
      .where('channel.id = :channelId', { channelId })
      .getOne();

    if (!channel) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Channel not found'
      };
    }

    const isMember = channel.recipients.some(r => r.userId === userId);
    if (!isMember && channel.type !== ChannelType.DM) {
      return {
        status: HttpStatus.FORBIDDEN,
        data: null,
        message: 'You are not a member of this channel'
      };
    }

    const recipients = channel.recipients
      .map(r => r.userId);

    if (recipients.length === 0) {
      return {
        status: HttpStatus.NO_CONTENT,
        data: null,
        message: 'No other recipients to ring'
      };
    }

    const client = await this.redisService.getClient();
    const pipeline = client.multi();

    const ringPayloads: VoiceRingState[] = recipients.filter(uid => uid !== userId).map(recipientId => ({
      initiatorId: userId,
      channelId,
      recipientId,
    }));

    for (const dto of ringPayloads) {
      pipeline.set(this.getVoiceRingKey(dto.channelId, dto.recipientId), JSON.stringify(dto));
      pipeline.sAdd(this.getVoiceRingChannelkey(dto.channelId), dto.recipientId);
      setTimeout(() => {
        this.handleDismissVoiceRing(dto.recipientId, dto.channelId);
      }, VOICE_RING_TIMEOUT);
    }

    try {
      await pipeline.exec();
    } catch (error) {
      console.error('Redis ring state error:', error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'Failed to set ring state in Redis'
      };
    }

    try {
      this.gatewayMQ.emit(
        VOICE_RING_EVENT,
        { recipients, data: ringPayloads } as Payload<VoiceRingStateDTO[]>
      );
    } catch (error) {
      console.error('Emit ring event failed:', error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'Failed to emit ring event'
      };
    }

    return {
      status: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Ringing sent successfully'
    };
  }

  async handleDismissVoiceRing(userId: string, channelId: string) {
    const client = await this.redisService.getClient();
    const key = this.getVoiceRingKey(channelId, userId);
    let voiceRingState: VoiceRingState;
    try {
      const raw = await client.get(key);
      if (!raw) {
        return {
          status: HttpStatus.NOT_FOUND,
          data: null,
          message: 'No active voice ring found for this user and channel.'
        };
      }

      voiceRingState = JSON.parse(raw as string) as VoiceRingState;
      if (!voiceRingState) throw new Error();

      await client.del(key);
      await client.sRem(this.getVoiceRingChannelkey(channelId), userId);
    } catch (error) {
      console.error('Redis ring state error:', error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'Failed to delete ring state in Redis'
      };
    }

    try {
      this.gatewayMQ.emit(
        VOICE_RING_DISMISS_EVENT,
        { recipients: [voiceRingState.initiatorId, voiceRingState.recipientId], data: voiceRingState } as Payload<VoiceRingStateDTO>
      );
    } catch (error) {
      console.error('Emit ring event failed:', error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'Failed to emit ring event'
      };
    }

    return {
      status: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Ringing dismissed successfully'
    };
  }


  async handleVoiceJoin(dto: VoiceEventDTO) {
    let channel = await this.channelsRepository
      .createQueryBuilder('channel')
      .innerJoinAndSelect('channel.recipients', 'channel_recipient')
      .where('channel.id = :channelId', { channelId: dto.channelId })
      .getOne();
    if (!channel) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Channel not found'
      };
    }

    if (!channel.recipients.find(r => r.userId === dto.userId)) {
      return {
        status: HttpStatus.FORBIDDEN,
        data: null,
        message: 'Channel not found'
      };
    }


    const client = await this.redisService.getClient();
    const state: VoiceState = { channelId: dto.channelId, userId: dto.userId, isDeafened: false, isMuted: false };
    await client.set(this.getVoiceStateKey(dto.channelId, dto.userId), JSON.stringify(state));
    await client.sAdd(this.getVoiceChannelKey(dto.channelId), dto.userId);

    await this.handleDismissVoiceRing(dto.userId, dto.channelId);


    const recipients = channel.recipients.map(r => r.userId);
    const payload: VoiceEventDTO = {
      channelId: state.channelId,
      userId: state.userId,
      type: VoiceEventType.VOICE_JOIN,
      data: {
        channelId: dto.channelId,
        userId: dto.userId
      } as VoiceStateDTO
    };

    this.gatewayMQ.emit(VOICE_UPDATE_EVENT, { recipients: recipients, data: payload } as Payload<VoiceEventDTO>);
  }

  async handleVoiceLeave(dto: VoiceEventDTO) {
    let channel = await this.channelsRepository
      .createQueryBuilder('channel')
      .innerJoinAndSelect('channel.recipients', 'channel_recipient')
      .where('channel.id = :channelId', { channelId: dto.channelId })
      .getOne();
    if (!channel) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Channel not found'
      };
    }

    if (!channel.recipients.find(r => r.userId === dto.userId)) {
      return {
        status: HttpStatus.FORBIDDEN,
        data: null,
        message: 'Channel not found'
      };
    }

    const client = await this.redisService.getClient();
    await client.del(this.getVoiceStateKey(dto.channelId, dto.userId));
    await client.sRem(this.getVoiceChannelKey(dto.channelId), dto.userId);

    const voiceStatesMember = await client.sMembers(this.getVoiceChannelKey(dto.channelId))

    if (voiceStatesMember.length === 0) {
      await this.clearChannelVoiceRings(dto.channelId);
    }

    const recipients = channel.recipients.map(r => r.userId);
    const payload: VoiceEventDTO = {
      channelId: dto.channelId,
      userId: dto.userId,
      type: VoiceEventType.VOICE_LEAVE,
      data: {
        channelId: dto.channelId,
        userId: dto.userId
      } as VoiceStateDTO

    };

    this.gatewayMQ.emit(VOICE_UPDATE_EVENT, { recipients: recipients, data: payload } as Payload<VoiceEventDTO>);
  }

  async handleGetVoiceStates(userId: string) {
    const channels = await this.channelsRepository
      .createQueryBuilder('channel')
      .innerJoinAndSelect('channel.recipients', 'channel_recipient')
      .where('channel_recipient.user_id = :userId', { userId: userId }).getMany();

    const client = await this.redisService.getClient();

    const voiceStates = [];
    for (const channel of channels) {
      const participants = await client.sMembers(this.getVoiceChannelKey(channel.id));
      if (participants.length === 0) continue;
      const rawStates = await client.mGet(participants.map(uid => this.getVoiceStateKey(channel.id, uid)));
      const states = rawStates.filter((v): v is string => v !== null).map(s => JSON.parse(s));
      voiceStates.push(...states);
    }

    this.gatewayMQ.emit(GET_VOICE_STATES_EVENT, { recipients: [userId], data: voiceStates } as Payload<VoiceStateDTO[]>)
  }

  async handleGetVoiceRings(userId: string) {
    const channels = await this.channelsRepository
      .createQueryBuilder('channel')
      .innerJoinAndSelect('channel.recipients', 'channel_recipient')
      .where('channel_recipient.user_id = :userId', { userId: userId }).getMany();

    const client = await this.redisService.getClient();

    const voiceRings = [];
    for (const channel of channels) {
      const recipients = await client.sMembers(this.getVoiceRingChannelkey(channel.id));
      if (recipients.length === 0) continue;

      const rawStates = await client.mGet(recipients.map(uid => this.getVoiceRingKey(channel.id, uid)));
      const states = rawStates.filter((v): v is string => v !== null).map(s => JSON.parse(s));
      voiceRings.push(...states);
    }

    this.gatewayMQ.emit(GET_VOICE_RINGS_EVENT, { recipients: [userId], data: voiceRings } as Payload<VoiceRingStateDTO[]>)
  }

  private async clearChannelVoiceRings(channelId: string) {
    const client = await this.redisService.getClient();

    const recipients = await client.sMembers(this.getVoiceRingChannelkey(channelId));
    try {
      for (const recipient of recipients) {
        const rawState = await client.get(this.getVoiceRingKey(channelId, recipient));
        if (rawState) {
          const state: VoiceRingState = JSON.parse(rawState as string);
          this.gatewayMQ.emit(VOICE_RING_DISMISS_EVENT, { recipients: [state.recipientId, state.initiatorId], data: state } as Payload<VoiceRingStateDTO>)
        }
      }
      await client.del(this.getVoiceRingChannelkey(channelId));
    } catch (error) {
      console.log(error);
    }
  }

  async handleRTCOfferCreated(dto: RTCOfferDTO) {
    const client = await this.redisService.getClient();
    const recipients = await client.sMembers(this.getVoiceChannelKey(dto.channelId));
    this.gatewayMQ.emit(CREATE_RTC_OFFER, { recipients: recipients.filter(r => r !== dto.userId), data: dto } as Payload<RTCOfferDTO>)
  }

  async handleRTCAnswerCreated(dto: RTCOfferDTO) {
    const client = await this.redisService.getClient();
    const recipients = await client.sMembers(this.getVoiceChannelKey(dto.channelId));
    this.gatewayMQ.emit(CREATE_RTC_ANSWER, { recipients: recipients.filter(r => r !== dto.userId), data: dto } as Payload<RTCOfferDTO>)
  }

  async handleCreateTransport(dto: RTCOfferDTO) {
    try {
      const response = await this.sfuService.createTransport(dto.channelId);
      if (response.status !== HttpStatus.OK) {
        return null;
      }

      this.gatewayMQ.emit(CREATE_TRANSPORT, { recipients: [dto.userId], data: response.data } as Payload<any>);
    }
    catch (error) {
      console.log(error)
    }
  }

  async handleCreateProducer(dto: ProducerCreatedDTO) {
    const client = await this.redisService.getClient();
    const recipients = await client.sMembers(this.getVoiceChannelKey(dto.channelId));
    console.log(`user id: ${dto.userId}, recipients: `, recipients.filter(r => r !== dto.userId));
    this.gatewayMQ.emit(PRODUCER_CREATED, { recipients: recipients.filter(r => r !== dto.userId), data: dto })
  }

  private getVoiceChannelKey(channelId: string) {
    return `voice:channel:${channelId}`;
  }

  private getVoiceStateKey(channelId: string, userId: string) {
    return `voice:${channelId}:${userId}`
  }

  private getVoiceRingKey(channelId: string, userId: string) {
    return `ring:${channelId}:${userId}`
  }

  private getVoiceRingChannelkey(channelId: string) {
    return `ring:channel:${channelId}}`
  }
  onModuleInit() {
    createMap(mapper, CreateDMChannelDTO, Channel);
    createMap(mapper, CreateChannelDTO, Channel);
    createMap(mapper, Channel, ChannelResponseDTO);
  }
}
