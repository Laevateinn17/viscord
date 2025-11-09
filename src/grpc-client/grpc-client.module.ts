import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";

@Module({
    imports: [
        ClientsModule.registerAsync({
            clients: [
                {
                    name: 'USERS_SERVICE',
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        return {
                            transport: Transport.GRPC,
                            options: {
                                package: 'users',
                                protoPath: join(__dirname, '../proto/users.proto'),
                                url: `${configService.get('USER_SERVICE_HOST')}:${configService.get('USER_SERVICE_GRPC_PORT')}`,
                            },
                        }
                    }
                },
                {
                    name: 'MESSAGES_SERVICE',
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        return {
                            transport: Transport.GRPC,
                            options: {
                                package: 'messages',
                                protoPath: join(__dirname, '../proto/messages.proto'),
                                url: `${configService.get('MESSAGE_SERVICE_HOST')}:${configService.get('MESSAGE_SERVICE_GRPC_PORT')}`,
                            },
                        }
                    }

                },
            ]
        })
    ],
    exports: [ClientsModule]
})
export class GrpcClientModule { }
