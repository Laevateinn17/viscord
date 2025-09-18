import { Module } from '@nestjs/common';
import { WsGateway } from "./ws.gateway";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { WsController } from './ws.controller';
import { HttpModule } from "@nestjs/axios";
import { SfuModule } from "src/sfu/sfu.module";
import { GrpcClientModule } from "src/grpc-client/grpc-client.module";
import { PresenceModule } from "src/presence/presence.module";

@Module({
    providers: [WsGateway],
    controllers: [WsController],
    exports: [WsGateway],
    imports: [SfuModule, GrpcClientModule, PresenceModule]
})
export class WsModule {
 }
