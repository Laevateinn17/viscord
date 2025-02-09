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
import { UpdateUsernameDTO } from './dto/update-username.dto';
import { UpdatePasswordDTO } from './dto/update-password.dto';
import { createMap } from '@automapper/core';
import { mapper } from 'src/mappings/mappers';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  private userService: ClientProxy;

  constructor(
    @InjectRepository(UserIdentity) private userRepository: Repository<UserIdentity>,
    private jwtService: JwtService
  ) {
    this.userService = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
        queue: 'user_queue',
        queueOptions: {durable: true}
      }
    });
  }

  async register(userData: RegisterUserDTO) : Promise<Result<AuthResponseDTO>> {
    const basicValidationMessage = userData.validate();
    if (basicValidationMessage) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: basicValidationMessage,
        data: null
      };
    }

    let searchedUser = await this.userRepository.findOneBy({email: userData.email});

    if (searchedUser) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'This email is already registered',
        data: null
      };
    }

    searchedUser = await this.userRepository.findOneBy({username: userData.username});

    if (searchedUser) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'This username is already used',
        data: null
      };
    }

    let user = mapper.map(userData, RegisterUserDTO, UserIdentity);

    const salt = await bcrypt.genSalt();


    user.password = await bcrypt.hash(user.password, salt);

    await this.userRepository.save(user);
    delete user.password;

    //send message to userprofile service
    this.userService.emit('user_created', {
      userId: user.id,
      displayName: userData.displayName
    });

    const response = new AuthResponseDTO();

    response.accessToken = await this.jwtService.signAsync({userId: user.id});
    response.refreshToken = await this.jwtService.signAsync({userId: user.id}, {expiresIn: '1y'});

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

    const user = await this.userRepository.findOne({where: [{email: loginDTO.identifier}, {username: loginDTO.identifier}]});

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

    response.accessToken = await this.jwtService.signAsync({userId: user.id});
    response.refreshToken = await this.jwtService.signAsync({userId: user.id}, {expiresIn: '1y'});


    return {
      status: HttpStatus.OK,
      message: 'User logged in successfully',
      data: response
    };
  }

  async refreshToken(userId: string): Promise<Result<string>> {
    const accessToken = await this.jwtService.signAsync({userId: userId});

    return {
      status: HttpStatus.OK,
      message: 'Access token refreshed successfully',
      data: accessToken
    };
  }

  async updateUsername(id: string, dto: UpdateUsernameDTO): Promise<Result<any>> {
    const validateResult = dto.validate();
    if (validateResult) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: validateResult,
        data: null
      };
    }

    await this.userRepository.update(id, {username: dto.username});
    
    return {
      status: HttpStatus.OK,
      message: 'Username updated successfully',
      data: null
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

    const user = await this.userRepository.findOne({where: {id}});

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

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  onModuleInit() {
    createMap(mapper, RegisterUserDTO, UserIdentity);
  }

}
