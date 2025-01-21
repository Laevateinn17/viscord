import { HttpStatus, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { Result } from 'src/interfaces/result.interface';
import { UserResponseDTO } from './dto/user-response.dto';
import { UserProfile } from 'src/user-profiles/entities/user-profile.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async create(userData: CreateUserDTO) : Promise<Result<UserResponseDTO>> {
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

    let user = new User(userData);
    user.profile = UserProfile.create(userData);

    const salt = bcrypt.genSaltSync();

    user.password = bcrypt.hashSync(user.password, salt);

    await this.userRepository.save(user);
    delete user.password;
    return {
      status: HttpStatus.CREATED,
      data: new UserResponseDTO(user),
      message: 'Account created successfully',
    };
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
