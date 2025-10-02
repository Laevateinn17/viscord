import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';
import { Repository } from "typeorm";
import { Invite } from "./entities/invite.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { generateRandomString } from "src/helpers/string";
import { generate } from "rxjs";
import { Result } from "src/interfaces/result.interface";
import { createMap } from "@automapper/core";
import { mapper } from "src/mappings/mappers";
import { InviteResponseDTO } from "./dto/invite-response.dto";

@Injectable()
export class InvitesService {
  private readonly INVITE_CODE_LENGTH = 8;

  constructor(
    @InjectRepository(Invite) private readonly invitesRepository: Repository<Invite>

  ) { }
  async create(dto: CreateInviteDto): Promise<Result<InviteResponseDTO>> {
    if (!dto.inviterId || !dto.channelId) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Missing some attributes'
      }
    }

    const existingInvite = await this.findOne(dto.channelId);
    if (existingInvite.status === HttpStatus.OK) {
      return existingInvite;
    }

    const code = await this.generateInviteCode();

    const invite = mapper.map(dto, CreateInviteDto, Invite);
    console.log(invite);

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

  findAll() {
    return `This action returns all invites`;
  }

  async findOne(channelId: string): Promise<Result<InviteResponseDTO>> {
    const existingInvite = await this.invitesRepository.findOneBy({ channelId });

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
