import { HttpStatus, Injectable } from '@nestjs/common';
import { RegisterUserDTO } from './dto/register-user.dto';
import { Result } from 'src/interfaces/result.interface';
import { UserIdentity } from 'src/auth/entities/user-identity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from './dto/login.dto';
import { AuthResponseDTO } from './dto/auth-response.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdatePasswordDTO } from './dto/update-password.dto';
import { createMap } from '@automapper/core';
import { mapper } from 'src/mappings/mappers';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { UserIdentityResponseDTO } from "./dto/user-identity-response.dto";
import { ErrorResponse } from "./errors/error-response";
import { RegisterError } from "./errors/register-error";
import { registerDecorator } from "class-validator";
import { UserIdentityCompactResponseDTO } from "./dto/user-identity-compact-response.dto";
import { HttpService } from "@nestjs/axios";
import { AxiosError, AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(UserIdentity) private readonly userRepository: Repository<UserIdentity>,
    private readonly jwtService: JwtService,
    private readonly userService: HttpService
  ) {
    // this.userService = ClientProxyFactory.create({
    //   transport: Transport.RMQ,
    //   options: {
    //     urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
    //     queue: 'user-queue',
    //     queueOptions: { durable: true }
    //   }
    // });
  }

  async register(userData: RegisterUserDTO): Promise<Result<AuthResponseDTO>> {
    const basicValidationMessage = userData.validate();
    if (basicValidationMessage) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: basicValidationMessage,
        data: null
      };
    }

    userData.email = userData.email.toLowerCase();
    userData.username = userData.username.toLowerCase();

    let searchedUser = await this.userRepository.findOneBy({ email: userData.email });

    if (searchedUser) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: {
          email: 'This email is already registered'
        } as RegisterError,
        data: null
      };
    }

    let user = mapper.map(userData, RegisterUserDTO, UserIdentity);

    const salt = await bcrypt.genSalt();

    user.password = await bcrypt.hash(user.password, salt);

    await this.userRepository.save(user);
    delete user.password;


    let userProfileResponse: AxiosResponse

    try {
      const url = `http://${process.env.USER_SERVICE_HOST}:${process.env.USER_SERVICE_PORT}/user-profiles`;

      userProfileResponse = await firstValueFrom(this.userService.post(url, {
        id: user.id,
        displayName: userData.displayName,
        username: userData.username
      }));
    } catch (error) {
      await this.userRepository.remove(user);

      if (error instanceof AxiosError) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: {
            username: error.response.data.message
          },
          data: null
        };
      }
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: {
          username: "An unknown error occurred",
          email: "An unknown error occurred"
        },
        data: null
      };
    }

    if (userProfileResponse.status !== HttpStatus.CREATED) {
      await this.userRepository.remove(user);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: {
          username: "An unknown error occurred",
          email: "An unknown error occurred"
        },
        data: null
      };
    }

    const response = new AuthResponseDTO();

    response.accessToken = await this.jwtService.signAsync({ userId: user.id });
    response.refreshToken = await this.jwtService.signAsync({ userId: user.id }, { expiresIn: '1y' });

    return {
      status: HttpStatus.CREATED,
      message: 'Account created successfully',
      data: response,
    };
  }

  async login(loginDTO: LoginDTO): Promise<Result<AuthResponseDTO>> {
    const validateResult = loginDTO.validate();

    if (validateResult) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: validateResult,
        data: null
      };
    }

    const user = await this.userRepository.findOne({ where: { email: loginDTO.identifier } });

    if (!user) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Login or password is invalid.',
        data: null
      };
    }

    if (!await bcrypt.compare(loginDTO.password, user.password)) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Login or password is invalid.',
        data: null
      };
    }

    const response = new AuthResponseDTO();

    response.accessToken = await this.jwtService.signAsync({ userId: user.id });
    response.refreshToken = await this.jwtService.signAsync({ userId: user.id }, { expiresIn: '1y' });


    return {
      status: HttpStatus.OK,
      message: 'User logged in successfully',
      data: response
    };
  }

  async refreshToken(userId: string): Promise<Result<string>> {
    const accessToken = await this.jwtService.signAsync({ userId: userId });

    return {
      status: HttpStatus.OK,
      message: 'Access token refreshed successfully',
      data: accessToken
    };
  }


  async updatePassword(id: string, dto: UpdatePasswordDTO): Promise<Result<any>> {
    const validateResult = dto.validate();

    if (validateResult) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: validateResult,
        data: null
      };
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (!await bcrypt.compare(dto.oldPassword, user.password)) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Old password does not match',
        data: null
      };
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepository.save(user);

    return {
      status: HttpStatus.OK,
      message: 'Password updated successfully',
      data: null
    }
  }

  async getUserIdentity(id: string): Promise<Result<UserIdentityResponseDTO>> {
    if (!id || id.length == 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "Invalid request",
      };
    }

    try {

      const user: UserIdentity = await this.userRepository.findOne({ where: { id: id } });

      if (!user) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: null,
          message: "User not found",
        };
      }

      delete user.password;
      return {
        status: HttpStatus.OK,
        data: mapper.map(user, UserIdentity, UserIdentityResponseDTO),
        message: "User identity retrieved successfully"
      };
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: null,
        message: "User not found",
      };
    }
  }


  onModuleInit() {
    createMap(mapper, RegisterUserDTO, UserIdentity);
    createMap(mapper, UserIdentity, UserIdentityResponseDTO);
    createMap(mapper, UserIdentity, UserIdentityCompactResponseDTO);
  }

}
