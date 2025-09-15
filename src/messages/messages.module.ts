import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ChannelMessageController, MessagesController } from './messages.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Message } from "./entities/message.entity";
import { StorageModule } from "src/storage/storage.module";
import { Attachment } from "./entities/attachment.entity";
import { MessageMention } from "./entities/message-mention.entity";
import { HttpModule } from "@nestjs/axios";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { GrpcClientModule } from "src/grpc-client/grpc-client.module";

@Module({
  controllers: [MessagesController, ChannelMessageController],
  providers: [MessagesService],
  imports: [TypeOrmModule.forFeature([Message, Attachment, MessageMention]), StorageModule, HttpModule, GrpcClientModule]
})
export class MessagesModule {}
