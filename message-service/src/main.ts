import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['messages'],
      protoPath: [join(__dirname, 'proto/messages.proto')],
      url: `0.0.0.0:${process.env.GRPC_PORT}`
    }
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
