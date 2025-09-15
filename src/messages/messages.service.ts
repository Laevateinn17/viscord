import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Result } from "src/interfaces/result.interface";
import { MessageResponseDTO } from "./dto/message-response.dto";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Message } from "./entities/message.entity";
import { mapper } from "src/mappings/mappers";
import { createMap } from "@automapper/core";
import { StorageService } from "src/storage/storage.service";
import { Attachment } from "./entities/attachment.entity";
import { AttachmentResponseDTO } from "./dto/attachment-response.dto";
import { MessageMention } from "./entities/message-mention.entity";
import { AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { ClientGrpc, ClientProxy, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { GATEWAY_QUEUE, MESSAGE_RECEIVED } from "src/constants/message-broker";
import { channel } from "diagnostics_channel";
import { Payload } from "src/interfaces/payload.dto";
import { ChannelResponseDTO } from "src/channels/dto/channel-response.dto";
import { ChannelsService } from "src/grpc/channels.service";

@Injectable()
export class MessagesService {
  private channelsGRPCService: ChannelsService;
  private gatewayMQ: ClientProxy;
  constructor(
    @InjectRepository(Message) private readonly messagesRepository: Repository<Message>,
    @InjectRepository(Attachment) private readonly attachmentsRepository: Repository<Attachment>,
    @InjectRepository(MessageMention) private readonly messageMentionsRepository: Repository<MessageMention>,
    private readonly storageService: StorageService,
    private readonly channelsService: HttpService, // should be moved to gRPC
    @Inject('CHANNELS_SERVICE') private client: ClientGrpc
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

  async create(dto: CreateMessageDto): Promise<Result<MessageResponseDTO>> {
    if (!dto.channelId || dto.channelId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid channel id'
      };
    }

    if (!dto.content || (dto.content.trim().length === 0 && dto.attachments.length === 0)) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Content cannot be empty'
      };
    }

    const channelResponse = await this.getChannelDetail(dto.senderId, dto.channelId);

    if (channelResponse.status !== HttpStatus.OK) {
      return { ...channelResponse, data: null };
    }
    const message = mapper.map(dto, CreateMessageDto, Message);
    try {
      await this.messagesRepository.save(message);
      if (dto.mentions) {
        const mentions: MessageMention[] = dto.mentions.map(m => ({ message: message, userId: m } as MessageMention));

        await this.messageMentionsRepository.save(mentions);
        message.mentions = mentions;
      }
    } catch (error) {
      console.error(error)
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'An unknown error occurred when saving message'
      };
    }



    const attachments: Attachment[] = [];

    if (dto.attachments) {
      try {
        const promises = dto.attachments.map(async (att) => {
          const response = await this.storageService.uploadFile(`attachments/${message.id}`, att);
          if (response.status !== HttpStatus.OK) throw Error();
          attachments.push({ id: undefined, url: response.data, message: message, type: att.mimetype });
        })

        await Promise.all(promises);
        await this.attachmentsRepository.save(attachments);
        message.attachments = attachments;
      } catch (error) {
        await this.messagesRepository.delete(message);

        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          data: null,
          message: 'Error uploading file'
        };
      }
    }

    const data = mapper.map(message, Message, MessageResponseDTO);
    if (dto.attachments) data.attachments = message.attachments.map(att => mapper.map(att, Attachment, AttachmentResponseDTO));
    if (dto.mentions) data.mentions = message.mentions.map(m => m.userId);
    const userIds = channelResponse.data.recipients.filter(r => r.id !== dto.senderId).map(r => r.id);
    try {
      this.gatewayMQ.emit(MESSAGE_RECEIVED, { recipients: userIds, data: data } as Payload<MessageResponseDTO>);
      this.acknowledgeMessage(message.senderId, message.channelId, message.id);
    } catch (error) {
      console.error(error);
    }

    return {
      status: HttpStatus.CREATED,
      data: data,
      message: 'Message saved successfully'
    }
  }

  findAll() {
    return `This action returns all messages`;
  }

  async getChannelMessages(userId: string, channelId: string): Promise<Result<MessageResponseDTO[]>> {
    if (!channelId || channelId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid channel id'
      };
    }

    const channelResponse = await this.getChannelDetail(userId, channelId);

    if (channelResponse.status !== HttpStatus.OK) {
      return { ...channelResponse, data: null };
    }

    const messages = await this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.attachments', 'attachment')
      .leftJoinAndSelect('message.mentions', 'mention')
      .where('message.channelId = :channelId', { channelId: channelId })
      .getMany()

    const data: MessageResponseDTO[] = messages.map(m => {
      const message = mapper.map(m, Message, MessageResponseDTO);
      message.attachments = m.attachments.map(at => mapper.map(at, Attachment, AttachmentResponseDTO));
      message.mentions = m.mentions.map(mm => mm.userId);

      return message;
    })

    return {
      status: HttpStatus.OK,
      data: data,
      message: 'Messages retrieved successfully'
    };
  }

  private async getChannelDetail(userId: string, channelId: string): Promise<Result<ChannelResponseDTO>> {
    let recipientResponse: AxiosResponse<any, any>;
    try {
      const url = `http://${process.env.GUILD_SERVICE_HOST}:${process.env.GUILD_SERVICE_PORT}/channels/${channelId}`;
      recipientResponse = (await firstValueFrom(this.channelsService.get(url, { headers: { 'X-User-Id': userId } }))).data;
      if (recipientResponse.status !== HttpStatus.OK) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: null,
          message: "Failed retrieving channel data"
        };
      }
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "Failed retrieving channel data"
      };
    }

    return {
      status: HttpStatus.OK,
      data: recipientResponse.data,
      message: 'Channel retrieved successfully'
    };
  }
  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }

  async acknowledgeMessage(userId: string, channelId: string, messageId: string): Promise<Result<null>> {
    const message = await this.messagesRepository.findOneBy({ id: messageId });
    console.log('message ack', message);

    if (message.channelId !== channelId) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid channel id'
      };
    }

    const result = await firstValueFrom(this.channelsGRPCService.acknowledgeMessage({ userId, channelId, messageId }));
    return result;
  }

  onModuleInit() {
    createMap(mapper, CreateMessageDto, Message);
    createMap(mapper, Message, MessageResponseDTO);
    createMap(mapper, Attachment, AttachmentResponseDTO);

    this.channelsGRPCService = this.client.getService<ChannelsService>('ChannelsService');
  }
}
