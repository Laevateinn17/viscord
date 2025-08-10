import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { GuildChannelsController, DMChannelsController, ChannelsController } from './channels.controller';
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Channel } from "./entities/channel.entity";
import { ChannelRecipient } from "./entities/channel-recipient.entity";
import { UserReadState } from "./entities/user-read-state.entity";
import { RedisModule } from "src/redis/redis.module";

@Module({
  controllers: [GuildChannelsController, DMChannelsController, ChannelsController],
  providers: [ChannelsService],
  imports: [HttpModule, RedisModule, TypeOrmModule.forFeature([Channel, ChannelRecipient, UserReadState]), SfuModule],
  exports: [ChannelsService]
})
export class ChannelsModule {}
