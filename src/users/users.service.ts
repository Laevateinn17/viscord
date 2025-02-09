import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { UserProfile } from "src/user-profiles/entities/user-profile.entity";
import { UserProfilesService } from "src/user-profiles/user-profiles.service";
import { ClientProxy, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom, lastValueFrom } from "rxjs";
import { Result } from "src/interfaces/result.interface";
import { UserResponseDTO } from "./dto/user-response.dto";
import { UserProfileResponseDTO } from "src/user-profiles/dto/user-profile-response.dto";
import { mapper } from "src/mappings/mappers";

@Injectable()
export class UsersService {
  constructor(
    private readonly userProfilesService: UserProfilesService,
    private readonly authService: HttpService
  ) { }

  async getById(id: string): Promise<Result<UserResponseDTO>> {
    if (!id || id.length == 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "Invalid request",
      };
    }

    const userProfileResponse: Result<UserProfileResponseDTO> = await this.userProfilesService.getById(id);

    if (userProfileResponse.status !== HttpStatus.OK) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "Failed retrieving user profile"
      };
    }

    let userIdentityResponse;

    try {
      const url = `http://${process.env.AUTH_SERVICE_HOST}:${process.env.AUTH_SERVICE_PORT}/auth/user/${id}`;
      userIdentityResponse = await firstValueFrom(this.authService.get(url));
      console.log(typeof (userIdentityResponse));
      console.log(userIdentityResponse)
      if (userIdentityResponse.status !== HttpStatus.OK) {
        console.log(userIdentityResponse)
        return {
          status: HttpStatus.BAD_REQUEST,
          data: null,
          message: "Failed retrieving user identity"
        };
      }
    } catch (error) {
      console.log(error)
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "Failed retrieving user identity"
      };
    }

    return {
      status: HttpStatus.OK,
      message: "User data retrieved successfully",
      data: { ...userIdentityResponse.data, profile: userProfileResponse.data }
    };

  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

}
