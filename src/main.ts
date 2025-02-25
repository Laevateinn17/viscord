import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { hostname } from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: "https://viscord.app",
    methods: 'GET,POST,PUT,DELETE',
    // credentials: true
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
      queue: 'user_queue',
      queueOptions: {
        durable: true
      }
    }
  });

  // await app.startAllMicroservices();
  await app.listen(process.env.APP_PORT);
  //  try {
  await app.startAllMicroservices();
  // } catch (err) {
  //   console.error('Failed to connect to RabbitMQ, will retry...');
  //   // Optionally retry logic here, or circuit breaker pattern
  // }
}
bootstrap();
