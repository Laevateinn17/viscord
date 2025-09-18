import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsGateway } from './ws/ws.gateway';
import { ConfigModule } from "@nestjs/config";
import { WsModule } from './ws/ws.module';
import { createMapper } from "@automapper/core";
import { classes } from "@automapper/classes";
import { RelationshipsController } from './relationships/relationships.controller';
import { RelationshipsModule } from './relationships/relationships.module';
import { MessagesController } from './messages/messages.controller';
import { MessagesModule } from './messages/messages.module';
import { UserProfilesController } from './user-profiles/user-profiles.controller';
import { UserProfilesModule } from './user-profiles/user-profiles.module';
import { GuildsController } from './guilds/guilds.controller';
import { GuildsModule } from './guilds/guilds.module';
import { ChannelsController } from './channels/channels.controller';
import { SfuService } from './sfu/sfu.service';
import { SfuModule } from './sfu/sfu.module';
import { HttpModule } from "@nestjs/axios";
import { GrpcClientModule } from './grpc-client/grpc-client.module';
import { RedisModule } from "./redis/redis.module";
import { PresenceModule } from './presence/presence.module';

export const mapper = createMapper({
  strategyInitializer: classes(),
})

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env'
  }), WsModule, RelationshipsModule, MessagesModule, UserProfilesModule, GuildsModule, SfuModule, HttpModule, GrpcClientModule, RedisModule, PresenceModule],
  controllers: [AppController, UserProfilesController, GuildsController, ChannelsController],
  providers: [AppService, SfuService]
})
export class AppModule {
}
