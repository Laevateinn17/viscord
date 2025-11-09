import { forwardRef, Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Invite } from "./entities/invite.entity";
import { GuildsModule } from "src/guilds/guilds.module";
import { ChannelsModule } from "src/channels/channels.module";
import { Guild } from "src/guilds/entities/guild.entity";

@Module({
  controllers: [InvitesController],
  providers: [InvitesService],
  imports: [TypeOrmModule.forFeature([Invite, Guild]), forwardRef(() => GuildsModule), forwardRef(() => ChannelsModule)],
  exports: [InvitesService]
})
export class InvitesModule {}

