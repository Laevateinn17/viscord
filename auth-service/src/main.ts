import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.enableCors({
  //   origin: "*",
  //   credentials: true,
  //   methods: "*",
  //   allowedHeaders: "Authorization,Origin,Content-Type,Accept"
  // });

  app.use(cookieParser());
  await app.listen(process.env.APP_PORT);
}
bootstrap();
