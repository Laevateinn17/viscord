import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, ValidationPipe, Res } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDTO } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateDMChannelDTO } from "./dto/create-dm-channel.dto";
import { Response } from "express";

@Controller('guilds/:guildId/channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Post()
  create(@Body() createChannelDto: CreateChannelDTO) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  findAll() {

  }

  @Get(':id')
  findOne(@Param('id') id: string) {
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
  }
}

@Controller('users/me/channels')
export class DMChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Post()
  async create(@Headers('X-User-Id') userId: string, @Body(new ValidationPipe({ transform: true })) dto: CreateDMChannelDTO, @Res() res: Response) {
    const result = await this.channelsService.createDMChannel(userId, dto);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Get()
  async getAll(@Headers('X-User-Id') userId: string, @Res() res: Response) {
    const result = await this.channelsService.getDMChannels(userId);
    const { status } = result;

    return res.status(status).json(result);

  }
}