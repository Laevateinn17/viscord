import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './messages/messages.module';
import { DatabaseModule } from "./database/database.module";
import { ConfigModule } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { env } from "process";
import { GrpcClientModule } from "./grpc-client/grpc-client.module";
@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env'
  }), DatabaseModule, MessagesModule, GrpcClientModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
