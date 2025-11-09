import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdentity } from './entities/user-identity.entity';
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: '5m'
        }
      })
    }),
    TypeOrmModule.forFeature([UserIdentity]),
    HttpModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
