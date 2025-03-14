import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateChannelDTO } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
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

@Injectable()
export class ChannelsService {

  constructor(
    private readonly usersService: HttpService,
    @InjectRepository(Channel) private readonly channelsRepository: Repository<Channel>,
    @InjectRepository(ChannelRecipient) private readonly channelRecipientRepository: Repository<ChannelRecipient>,
  ) { }

  async create(dto: CreateChannelDTO): Promise<Result<ChannelResponseDTO>> {
    if (!dto.guildId || dto.guildId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid guild id'
      };
    }

    const channel = mapper.map(dto, CreateChannelDTO, Channel);
    channel
    try {
      await this.channelsRepository.save(channel);
    } catch (error) {
      console.error(error);
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

    const existingChannel = await this.channelsRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.recipients', 'channel_recipient')
      .where('channel_recipient.user_id IN (:...recipients) AND channel.type = :channelType', { recipients: [userId, dto.recipientId], channelType: ChannelType.DM })
      .select('channel.id').getOne();

    console.log(existingChannel);

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
      const recipient = await this.channelRecipientRepository.findOneBy({ channelId: channel.id, userId: Not(userId) });
      let recipientResponse: AxiosResponse<UserProfileResponseDTO, any>;
      try {
        const url = `http://${process.env.USER_SERVICE_HOST}:${process.env.USER_SERVICE_PORT}/user-profiles/${recipient.userId}`;
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
      channel.recipients = [recipientResponse.data];
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
    console.log(data);
    return {
      status: HttpStatus.OK,
      data: data,
      message: 'Channels retrieved successfully'
    };
  }

  onModuleInit() {
    createMap(mapper, CreateDMChannelDTO, Channel);
    createMap(mapper, CreateChannelDTO, Channel);
    createMap(mapper, Channel, ChannelResponseDTO);
  }
}
