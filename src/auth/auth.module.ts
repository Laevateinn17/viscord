import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdentity } from './entities/user-identity.entity';

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
    TypeOrmModule.forFeature([UserIdentity])
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
