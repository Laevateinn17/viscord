import { forwardRef, Module } from '@nestjs/common';
import { WsGateway } from "./ws.gateway";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { WsController } from './ws.controller';
import { HttpModule } from "@nestjs/axios";
import { SfuModule } from "src/sfu/sfu.module";
import { GrpcClientModule } from "src/grpc-client/grpc-client.module";
import { PresenceModule } from "src/presence/presence.module";
import { RedisModule } from "src/redis/redis.module";
import { ConnectionsModule } from "src/connections/connections.module";
import { SubscriptionsModule } from "src/subscriptions/subscriptions.module";

@Module({
    providers: [WsGateway],
    controllers: [WsController],
    exports: [WsGateway],
    imports: [SfuModule, GrpcClientModule, forwardRef(() => PresenceModule), RedisModule, ConnectionsModule, SubscriptionsModule]
})
export class WsModule {
}
