import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
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
import { UserProfilesService } from "src/user-profiles/grpc/user-profiles.service";
import { ClientGrpc } from "@nestjs/microservices";
import { UserChannelState } from "src/channels/entities/user-channel-state.entity";

@Injectable()
export class GuildsService {
  private usersServiceGrpc: UserProfilesService;

  constructor(
    @InjectRepository(Guild) private readonly guildsRepository: Repository<Guild>,
    @InjectRepository(GuildMember) private readonly guildMembersRepository: Repository<GuildMember>,
    @Inject(forwardRef(() => ChannelsService)) private readonly channelsService: ChannelsService,
    private readonly storageService: StorageService,
    @Inject('USERS_SERVICE') private usersGRPCClient: ClientGrpc
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
      const textChannelResponse = await this.channelsService.create(userId, { guildId: guild.id, name: 'general', type: ChannelType.Text, parentId: response.data.id, isPrivate: false });

      const voiceCategoryResponse = await this.channelsService.create(userId, { guildId: guild.id, name: 'Voice Channels', type: ChannelType.Category, isPrivate: false });
      if (voiceCategoryResponse.status !== HttpStatus.CREATED) throw new Error(voiceCategoryResponse.message);
      const voiceChannelResponse = await this.channelsService.create(userId, { guildId: guild.id, name: 'General', type: ChannelType.Voice, parentId: voiceCategoryResponse.data.id, isPrivate: false });


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

    const response = await this.findOne(userId, guild.id);

    return {
      status: HttpStatus.CREATED,
      data: response.data,
      message: "Guild created successfully"
    };

  }

  async findAll(userId: string): Promise<Result<GuildResponseDTO[]>> {
    const guilds = await this.guildsRepository
      .createQueryBuilder('guild')
      .leftJoinAndSelect('guild.members', 'member')
      .leftJoinAndSelect('guild.channels', 'channel')
      .leftJoinAndSelect('channel.parent', 'parent_channel')
      .where(qb => {
        const subQuery = qb
          .subQuery()
          .select('gm.guildId')
          .from('guild_member', 'gm')
          .where('gm.userId = :userId')
          .getQuery();

        return 'guild.id IN ' + subQuery;
      })
      .setParameter('userId', userId)
      .getMany();

    console.log(guilds[0].id, guilds[0].members)

    const result = await Promise.all(
      guilds.map(async (guild) => {
        const data = mapper.map(guild, Guild, GuildResponseDTO);

        const membersResponse: Result<UserProfileResponseDTO[]> =
          await firstValueFrom(
            this.usersServiceGrpc.getUserProfiles({
              userIds: guild.members.map((m) => m.userId),
            }),
          );

        data.members = membersResponse.data ?? [];

        data.channels = await Promise.all(
          guild.channels.map(async (ch) => {
            const channel = mapper.map(ch, Channel, ChannelResponseDTO);
            channel.recipients = data.members;

            const userChannelStateResponse = await this.channelsService.getUserChannelState(userId, channel.id);
            channel.userChannelState = userChannelStateResponse.data;

            return channel;
          }),
        );

        return data;
      }),
    );

    return {
      status: HttpStatus.OK,
      data: result,
      message: 'Guilds retrieved successfully with details',
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
      .leftJoinAndSelect('channel.parent', 'parent_channel')
      .where('guild.id = :guildId', { guildId: guildId }).getOne();


    if (!guild.members.find(m => m.userId === userId)) {
      return {
        status: HttpStatus.FORBIDDEN,
        data: null,
        message: 'Not permitted to perform this action'
      };
    }

    const data = mapper.map(guild, Guild, GuildResponseDTO);
    const membersResponse: Result<UserProfileResponseDTO[]> = await firstValueFrom(this.usersServiceGrpc.getUserProfiles({ userIds: guild.members.map(re => re.userId) }));

    data.members = membersResponse.data ?? [];

    data.channels = await Promise.all(guild.channels.map(async ch => {
      const channel = mapper.map(ch, Channel, ChannelResponseDTO);
      channel.recipients = data.members; // can apply role based filter
      return channel;
    }));

    return {
      status: HttpStatus.OK,
      data: data,
      message: 'Guild data retrieved successfully'
    };
  }

  async join(userId: string, guildId: string, channelId: string): Promise<Result<GuildResponseDTO>> {
    const guild = await this.guildsRepository.findOne({ where: { id: guildId }, relations: ['members'] });

    if (!guild) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'This guild does not exist'
      };
    }

    if (guild.members.find(m => m.userId === userId)) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'User is already a member of this guild'
      };
    }
    const newMember = new GuildMember();
    newMember.guildId = guildId;
    newMember.userId = userId;
    guild.members.push(newMember);

    try {
      await this.guildMembersRepository.save(newMember);
    } catch (error) {
      console.log(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'An error occurred while saving new member'
      };
    }

    return await this.findOne(userId, guildId);
  }

  update(id: number, updateGuildDto: UpdateGuildDto) {
    return `This action updates a #${id} guild`;
  }

  remove(id: number) {
    return `This action removes a #${id} guild`;
  }

  onModuleInit() {

    this.usersServiceGrpc = this.usersGRPCClient.getService<UserProfilesService>('UserProfilesService');

    createMap(mapper, CreateGuildDto, Guild);
    createMap(mapper, Guild, GuildResponseDTO);
  }
}
