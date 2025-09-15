import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateGuildDto } from './dto/create-guild.dto';
import { UpdateGuildDto } from './dto/update-guild.dto';
import { InjectRepository } from "@nestjs/typeorm"
import { Guild } from "./entities/guild.entity";
import { Repository } from "typeorm";
import { mapper } from "src/mappings/mappers";
import { createMap } from "@automapper/core";
import { GuildMember } from "./entities/guild-members.entity";
import { Result } from "../interfaces/result.interface"
import { GuildResponseDTO } from "./dto/guild-response.dto";
import { StorageService } from "src/storage/storage.service";
import { HttpStatusCode } from "axios";
import { ChannelsService } from "src/channels/channels.service";
import { ChannelType } from "src/channels/enums/channel-type.enum";
import { ChannelResponseDTO } from "src/channels/dto/channel-response.dto";
import { Channel } from "src/channels/entities/channel.entity";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { UserProfileResponseDTO } from "src/user-profiles/dto/user-profile-response.dto";

@Injectable()
export class GuildsService {

  constructor(
    @InjectRepository(Guild) private readonly guildsRepository: Repository<Guild>,
    @InjectRepository(GuildMember) private readonly guildMembersRepository: Repository<GuildMember>,
    private readonly channelsService: ChannelsService,
    private readonly storageService: StorageService,
    private readonly userService: HttpService
  ) {

  }

  async create(userId: string, dto: CreateGuildDto): Promise<Result<GuildResponseDTO>> {
    if (!dto.name || dto.name.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "Cannot be empty."
      };
    }

    const guild = mapper.map(dto, CreateGuildDto, Guild);
    guild.ownerId = userId;

    try {
      await this.guildsRepository.save(guild);
      //create default guild template
      const owner = await this.guildMembersRepository.save({ guild: guild, userId: userId });
      guild.owner = owner;
      // create channel categories and channels

      if (dto.iconImage) {
        const types = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
        if (!types.find(type => type === dto.iconImage.mimetype)) {
          return {
            status: HttpStatus.BAD_REQUEST,
            data: null,
            message: "Invalid icon extension"
          };
        }

        const response = await this.storageService.uploadFile(`icons/${guild.id}`, dto.iconImage);

        if (response.status !== HttpStatus.OK) {
          await this.guildsRepository.delete(guild);
          return {
            ...response,
            data: null
          };
        }
        guild.iconURL = response.data;
      }

      const response = await this.channelsService.create(userId, { guildId: guild.id, name: 'Text Channels', type: ChannelType.Category, isPrivate: false });
      if (response.status !== HttpStatus.CREATED) throw new Error(response.message);
      await this.channelsService.create(userId, { guildId: guild.id, name: 'general', type: ChannelType.Text, parentId: response.data.id, isPrivate: false });

      const voiceCategoryResponse = await this.channelsService.create(userId, { guildId: guild.id, name: 'Voice Channels', type: ChannelType.Category, isPrivate: false });
      if (voiceCategoryResponse.status !== HttpStatus.CREATED) throw new Error(voiceCategoryResponse.message);
      await this.channelsService.create(userId, { guildId: guild.id, name: 'General', type: ChannelType.Voice, parentId: voiceCategoryResponse.data.id, isPrivate: false });

      await this.guildsRepository.save(guild);

    } catch (error) {
      await this.guildsRepository.delete(guild);
      console.error(error)
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Failed saving guild data",
        data: null
      }
    }

    return {
      status: HttpStatus.CREATED,
      data: mapper.map(guild, Guild, GuildResponseDTO),
      message: "Guild created successfully"
    };

  }

  async findAll(userId: string): Promise<Result<GuildResponseDTO[]>> {
    const guilds = await this.guildsRepository
      .createQueryBuilder('guild')
      .leftJoinAndSelect('guild.members', 'member')
      .where('member.userId = :userId', { userId: userId })
      .getMany()
    return {
      status: HttpStatus.OK,
      data: guilds.map(guild => {
        return mapper.map(guild, Guild, GuildResponseDTO)
      }),
      message: 'Guilds retrieved succesffully'
    };
  }

  async findOne(userId: string, guildId: string): Promise<Result<GuildResponseDTO>> {
    if (!guildId || guildId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid Guild Id'
      };
    }

    const guild = await this.guildsRepository
      .createQueryBuilder('guild')
      .leftJoinAndSelect('guild.members', 'member')
      .leftJoinAndSelect('guild.channels', 'channel')
      .leftJoinAndSelect('channel.parent', 'parentChannel')
      .leftJoinAndSelect('channel.recipients', 'recipients')
      .where('guild.id = :guildId', { guildId: guildId }).getOne();


    if (!guild.members.find(m => m.userId === userId)) {
      return {
        status: HttpStatus.FORBIDDEN,
        data: null,
        message: 'Not permitted to perform this action'
      };
    }

    const data = mapper.map(guild, Guild, GuildResponseDTO);
    // data.channels = guild.channels.map(ch => {
    //   const channel = mapper.map(ch, Channel, ChannelResponseDTO)
    //   channel.recipients = mapper.map()
    // });

    data.members = await Promise.all(guild.members.map(async (m) => {
      try {
        const url = `http://${process.env.USER_SERVICE_HOST}:${process.env.USER_SERVICE_PORT}/user-profiles/${m.userId}`;
        const userIdentityResponse = (await firstValueFrom(this.userService.get(url))).data;

        if (userIdentityResponse.status !== HttpStatus.OK) {
          return {};
        }

        return userIdentityResponse.data

      } catch (error) {
        return {};
      }
    }));

    return {
      status: HttpStatus.OK,
      data: data,
      message: 'Guild data retrieved successfully'
    };
  }

  update(id: number, updateGuildDto: UpdateGuildDto) {
    return `This action updates a #${id} guild`;
  }

  remove(id: number) {
    return `This action removes a #${id} guild`;
  }

  onModuleInit() {
    createMap(mapper, CreateGuildDto, Guild);
    createMap(mapper, Guild, GuildResponseDTO);
  }
}
