import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, UploadedFile, UseInterceptors, Headers, Res } from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { UpdateGuildDto } from './dto/update-guild.dto';
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";

@Controller('guilds')
export class GuildsController {
  constructor(private readonly guildsService: GuildsService) { }

  @Post()
  @UseInterceptors(FileInterceptor('icon'))
  async create(@Headers('X-User-Id') userId: string, @UploadedFile() file: Express.Multer.File, @Body(new ValidationPipe({ transform: true })) dto: CreateGuildDto, @Res() res: Response) {
    dto.iconImage = file;
    const result = await this.guildsService.create(userId, dto);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Get()
  async findAll(@Headers('X-User-Id') userId: string, @Res() res: Response) {
    const result = await this.guildsService.findAll(userId);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Get(':id')
  async getDetail(@Headers('X-User-Id') userId: string, @Param('id') guildId: string, @Res() res: Response) {
    const result = await this.guildsService.findOne(userId, guildId);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGuildDto: UpdateGuildDto) {
    return this.guildsService.update(+id, updateGuildDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guildsService.remove(+id);
  }
}
