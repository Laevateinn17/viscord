import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Res, UseInterceptors, UploadedFiles, ValidationPipe } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Response } from 'express'
import { AnyFilesInterceptor, FileInterceptor } from "@nestjs/platform-express";
import { GrpcMethod } from "@nestjs/microservices";
import { GetUnreadCountDTO } from "src/channels/dto/get-unread-count.dto";
import { AcknowledgeMessageDTO } from "src/channels/dto/acknowledge-message.dto";

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

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
  async getChannelMessages(@Headers('X-User-Id') userId: string, @Param('channelId') channelId: string, @Res() res: Response) {
    const result = await this.messagesService.getChannelMessages(userId, channelId);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Post(':channelId/messages')
  @UseInterceptors(AnyFilesInterceptor())
  async create(@Headers('X-User-Id') userId: string, @Param('channelId') channelId: string, @UploadedFiles() attachments: Array<Express.Multer.File>, @Body(new ValidationPipe({ transform: true })) dto: CreateMessageDto, @Res() res: Response) {
    dto.senderId = userId;
    dto.channelId = channelId;
    dto.attachments = attachments;
    const result = await this.messagesService.create(dto);
    const { status } = result;

    return res.status(status).json(result);
  }

  @Post(':channelId/messages/:messageId/ack')
  async acknowledgeMessage(@Headers('X-User-Id') userId: string, @Param('channelId') channelId: string, @Param('messageId') messageId: string, @Res() res: Response) {
    const dto = new AcknowledgeMessageDTO();
    dto.channelId = channelId;
    dto.userId = userId;
    dto.messageId = messageId;

    const result = await this.messagesService.acknowledgeMessage(dto);
    const { status } = result;

    return res.status(status).json(result);
  }

  @GrpcMethod('MessagesService', 'GetUnreadCount')
  async getUnreadCount(dto: GetUnreadCountDTO) {
    return await this.messagesService.getUnreadCount(dto);
  }
}