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
import { CHANNEL_QUEUE, GATEWAY_QUEUE, MESSAGE_CREATED, MESSAGE_RECEIVED_EVENT } from "src/constants/events";
import { channel } from "diagnostics_channel";
import { Payload } from "src/interfaces/payload.dto";
import { ChannelResponseDTO } from "src/channels/dto/channel-response.dto";
import { ChannelsService } from "src/channels/channels.service";
import { GetUnreadCountDTO } from "src/channels/dto/get-unread-count.dto";
import { AcknowledgeMessageDTO } from "src/channels/dto/acknowledge-message.dto";
import { MessageCreatedDTO } from "src/channels/dto/message-created.dto";
import { GuildsService } from "src/guilds/guilds.service";
import { Permissions } from "src/guilds/enums/permissions.enum";
import { ChannelType } from "src/channels/dto/enums/channel-type.enum";

@Injectable()
export class MessagesService {
  private channelsService: ChannelsService;
  private guildsService: GuildsService;
  private gatewayMQ: ClientProxy;
  private channelsMQ: ClientProxy;
  constructor(
    @InjectRepository(Message) private readonly messagesRepository: Repository<Message>,
    @InjectRepository(Attachment) private readonly attachmentsRepository: Repository<Attachment>,
    @InjectRepository(MessageMention) private readonly messageMentionsRepository: Repository<MessageMention>,
    private readonly storageService: StorageService,
    @Inject('CHANNELS_SERVICE') private channelsGRPCClient: ClientGrpc,
    @Inject('GUILDS_SERVICE') private guildsGRPCClient: ClientGrpc
  ) {
    this.gatewayMQ = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
        queue: GATEWAY_QUEUE,
        queueOptions: { durable: true }
      }
    });

    this.channelsMQ = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
        queue: CHANNEL_QUEUE,
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

    const channelResponse = await firstValueFrom(this.channelsService.getChannelById({ userId: dto.senderId, channelId: dto.channelId }));

    if (channelResponse.status !== HttpStatus.OK) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'User is not a recipient of this channel',
        data: null
      };
    }

    const channel: ChannelResponseDTO = channelResponse.data;
    if (channel.type !== ChannelType.DM && channel.type !== ChannelType.Text) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Cannot send message in this channel ',
        data: null
      };
    }

    const { isAllowed } = await firstValueFrom(this.guildsService.checkPermission({ userId: dto.senderId, channelId: dto.channelId, guildId: channelResponse.data.guildId, permission: Permissions.SEND_MESSAGES.toString() }))
    if (!isAllowed && channel.type !== ChannelType.DM) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'User does not have the permission to send message to this channel',
        data: null
      }
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
    try {
      this.channelsMQ.emit(MESSAGE_CREATED, data as MessageResponseDTO);

      const ackMessageDTO = new AcknowledgeMessageDTO();
      ackMessageDTO.userId = message.senderId;
      ackMessageDTO.channelId = message.channelId;
      ackMessageDTO.messageId = message.id;

      this.acknowledgeMessage(ackMessageDTO);
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

    const channelResponse = await firstValueFrom(this.channelsService.getChannelById({ userId, channelId }));
    if (channelResponse.status !== HttpStatus.OK) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'User is not a recipient of this channel',
        data: null
      };
    }

    const channel = channelResponse.data;
    if (channel.type !== ChannelType.DM && channel.type !== ChannelType.Text) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Cannot send message in this channel ',
        data: null
      };
    }

    const { isAllowed } = await firstValueFrom(this.guildsService.checkPermission({ userId, channelId, guildId: channelResponse.data.guildId, permission: Permissions.VIEW_CHANNELS.toString() }))
    if (!isAllowed && channel.type !== ChannelType.DM) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'User does not have the permission to view this channel',
        data: null
      };
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

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }

  async acknowledgeMessage(dto: AcknowledgeMessageDTO): Promise<Result<null>> {
    const message = await this.messagesRepository.findOneBy({ id: dto.messageId });

    if (message.channelId !== dto.channelId) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid channel id'
      };
    }

    const result = await firstValueFrom(this.channelsService.acknowledgeMessage(dto));

    return result;
  }

  async getUnreadCount(dto: GetUnreadCountDTO) {
    const messages = await this.messagesRepository
      .createQueryBuilder('message')
      .where('message.channel_id = :channelId', { channelId: dto.channelId })
      .andWhere('message.created_at > (SELECT created_at FROM message where id = :id)', { id: dto.lastMessageId })
      .getMany();

    return messages.length;
  }

  onModuleInit() {
    createMap(mapper, CreateMessageDto, Message);
    createMap(mapper, Message, MessageResponseDTO);
    createMap(mapper, Attachment, AttachmentResponseDTO);

    this.channelsService = this.channelsGRPCClient.getService<ChannelsService>('ChannelsService');
    this.guildsService = this.guildsGRPCClient.getService<GuildsService>('GuildsService');
  }
}
