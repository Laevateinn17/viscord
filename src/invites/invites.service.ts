import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';
import { MoreThan, Repository } from "typeorm";
import { Invite } from "./entities/invite.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { generateRandomString } from "src/helpers/string";
import { generate } from "rxjs";
import { Result } from "src/interfaces/result.interface";
import { createMap } from "@automapper/core";
import { mapper } from "src/mappings/mappers";
import { InviteResponseDTO } from "./dto/invite-response.dto";
import { GuildResponseDTO } from "src/guilds/dto/guild-response.dto";
import { GuildsService } from "src/guilds/guilds.service";
import { Guild } from "src/guilds/entities/guild.entity";
import { Channel } from "src/channels/entities/channel.entity";
import { ChannelType } from "src/channels/enums/channel-type.enum";
import { ChannelsService } from "src/channels/channels.service";
import { Permissions } from "src/guilds/enums/permissions.enum";

@Injectable()
export class InvitesService {
  private readonly INVITE_CODE_LENGTH = 8;

  constructor(
    @Inject(forwardRef(() => GuildsService)) private readonly guildsService: GuildsService,
    @Inject(forwardRef(() => ChannelsService)) private readonly channelsService: ChannelsService,
    @InjectRepository(Invite) private readonly invitesRepository: Repository<Invite>,
    @InjectRepository(Guild) private readonly guildsRepository: Repository<Guild>
  ) { }
  async createOrGet(dto: CreateInviteDto): Promise<Result<InviteResponseDTO>> {
    if (!dto.inviterId || !dto.guildId) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Missing some attributes'
      };
    }

    const guild = await this.guildsRepository.findOne({ where: { id: dto.guildId }, relations: ['channels'] });
    if (!guild) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Guild not found'
      };
    }

    const channel = guild.channels.find(ch => ch.id === dto.channelId);

    if (dto.channelId && (!channel || (channel.type !== ChannelType.Voice && channel.type !== ChannelType.Text))) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Cannot create invite for this channel'
      };
    }

    const effectivePermission = await (dto.channelId ?
      this.channelsService.getEffectivePermission({ userId: dto.inviterId, guildId: dto.guildId, channelId: dto.channelId }) :
      this.guildsService.getBasePermission(dto.inviterId, dto.guildId));

    if ((effectivePermission & Permissions.CREATE_INVITES) !== Permissions.CREATE_INVITES) {
      return {
        status: HttpStatus.FORBIDDEN,
        data: null,
        message: 'User does not have permission to create invite link'
      };
    }

    const existingInvite = await this.findOne(dto.channelId, dto.maxAge);
    if (existingInvite.status === HttpStatus.OK) {
      return existingInvite;
    }

    const code = await this.generateInviteCode();

    const invite = mapper.map(dto, CreateInviteDto, Invite);

    if (dto.maxAge) {
      const expiresDate = new Date();
      expiresDate.setSeconds(expiresDate.getSeconds() + dto.maxAge);
      invite.expiresAt = expiresDate;
    }

    invite.code = code;

    try {
      await this.invitesRepository.save(invite);
    } catch (error) {
      console.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'An error occurred while creating invite'
      };
    }

    const payload: InviteResponseDTO = mapper.map(invite, Invite, InviteResponseDTO);

    return {
      status: HttpStatus.OK,
      data: payload,
      message: 'Invite created successfully'
    }
  }

  async getChannelInvites(channelId: string): Promise<Result<InviteResponseDTO[]>> {
    const invites = await this.invitesRepository.findBy({ channelId, expiresAt: MoreThan(new Date()) });

    const payload: InviteResponseDTO[] = invites.map(invite => mapper.map(invite, Invite, InviteResponseDTO));

    return {
      status: HttpStatus.OK,
      data: payload,
      message: 'Invites retrieved successfully'
    };
  }

  async findOne(channelId: string, maxAge: number): Promise<Result<InviteResponseDTO>> {
    const existingInvite = await this.invitesRepository.findOneBy({ channelId, maxAge });

    const payload: InviteResponseDTO = mapper.map(existingInvite, Invite, InviteResponseDTO);

    if (!existingInvite) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invite does not exist'
      };
    }

    return {
      status: HttpStatus.OK,
      data: payload,
      message: 'Invite retrieved successfully'
    };
  }

  async deleteInvite(userId: string, inviteId: string): Promise<Result<null>> {
    const invite = await this.invitesRepository.findOneBy({ id: inviteId });

    if (!invite) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invite does not exist'
      };
    }

    try {
      await this.invitesRepository.delete({ id: invite.id });
    } catch (error) {
      console.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'An error occurred while deleting invite'
      };
    }

    return {
      status: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Invite deleted successfully'
    };
  }

  async joinGuild(userId: string, inviteCode: string): Promise<Result<GuildResponseDTO>> {
    const invite = await this.invitesRepository.findOneBy({ code: inviteCode });

    if (!invite) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Invalid invite code'
      }
    }

    return await this.guildsService.join(userId, invite.guildId, invite.channelId);
  }


  update(id: number, updateInviteDto: UpdateInviteDto) {
    return `This action updates a #${id} invite`;
  }

  remove(id: number) {
    return `This action removes a #${id} invite`;
  }

  async generateInviteCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      code = generateRandomString(this.INVITE_CODE_LENGTH);
      exists = await this.invitesRepository.exists({ where: { code } });
    }

    return code;
  }

  onModuleInit() {
    createMap(mapper, CreateInviteDto, Invite);
    createMap(mapper, Invite, InviteResponseDTO);
  }
}
