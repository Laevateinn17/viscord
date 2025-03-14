import { Module } from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Guild } from "./entities/guild.entity";
import { GuildMember } from "./entities/guild-members.entity";
import { StorageModule } from "src/storage/storage.module";
import { ChannelsModule } from "src/channels/channels.module";
import { HttpModule } from "@nestjs/axios";

@Module({
  controllers: [GuildsController],
  providers: [GuildsService],
  imports: [TypeOrmModule.forFeature([Guild, GuildMember]), StorageModule, ChannelsModule, HttpModule]
})
export class GuildsModule {}
