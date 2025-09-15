import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Res, UseInterceptors, UploadedFiles, ValidationPipe } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import {Response} from 'express'
import { AnyFilesInterceptor, FileInterceptor } from "@nestjs/platform-express";

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }


  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(@Headers('X-User-Id') userId: string, @UploadedFiles() attachments: Array<Express.Multer.File>, @Body(new ValidationPipe({transform: true})) dto: CreateMessageDto, @Res() res: Response) {
    dto.senderId = userId;
    dto.attachments = attachments;
    const result = await this.messagesService.create(dto);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(+id);
  }
}

@Controller('channels')
export class ChannelMessageController {
  constructor(private readonly messagesService: MessagesService) { }

  @Get(':channelId/messages')
  async getChannelMessages(@Headers('X-User-Id') userId: string, @Param('channelId') id: string, @Res() res: Response) {
    const result = await this.messagesService.getChannelMessages(userId, id);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Post(':channelId/messages/:messageId/ack') 
  async acknowledgeMessage(@Headers('X-User-Id') userId: string, @Param('channelId') channelId: string, @Param('messageId') messageId: string, @Res() res: Response) {
    const result = await this.messagesService.acknowledgeMessage(userId, channelId, messageId);
    const { status } = result;

    return res.status(status).json(result);

  }
}