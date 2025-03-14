import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelDTO } from './create-channel.dto';

export class UpdateChannelDto extends PartialType(CreateChannelDTO) {}
