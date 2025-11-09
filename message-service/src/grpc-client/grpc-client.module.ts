import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";

@Module({
    imports: [
        ClientsModule.registerAsync({
            clients: [
                {
                    name: 'CHANNELS_SERVICE',
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        return {
                        transport: Transport.GRPC,
                        options: {
                            package: 'channels',
                            protoPath: join(__dirname, '../proto/channels.proto'),
                            url: `${configService.get('GUILD_SERVICE_HOST')}:${configService.get('GUILD_SERVICE_GRPC_PORT')}`,
                        },
                    }}
                },
                {
                    name: 'GUILDS_SERVICE',
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        return {
                        transport: Transport.GRPC,
                        options: {
                            package: 'guilds',
                            protoPath: join(__dirname, '../proto/guilds.proto'),
                            url: `${configService.get('GUILD_SERVICE_HOST')}:${configService.get('GUILD_SERVICE_GRPC_PORT')}`,
                        },
                    }}
                },
            ]
        })
    ],
    exports: [ClientsModule]
})
export class GrpcClientModule { }
