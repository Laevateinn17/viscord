import { forwardRef, Module } from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Guild } from "./entities/guild.entity";
import { GuildMember } from "./entities/guild-members.entity";
import { StorageModule } from "src/storage/storage.module";
import { ChannelsModule } from "src/channels/channels.module";
import { HttpModule } from "@nestjs/axios";
import { GrpcClientModule } from "src/grpc-client/grpc-client.module";
import { UserChannelState } from "src/channels/entities/user-channel-state.entity";
import { Role } from "src/roles/entities/role.entity";
import { InvitesModule } from "src/invites/invites.module";

@Module({
  controllers: [GuildsController],
  providers: [GuildsService],
  imports: [TypeOrmModule.forFeature([Guild, GuildMember, Role]), StorageModule, ChannelsModule, HttpModule, GrpcClientModule, InvitesModule],
  exports: [GuildsService]
})

export class GuildsModule { }
