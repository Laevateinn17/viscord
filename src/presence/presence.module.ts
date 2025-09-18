import { Module } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceController } from './presence.controller';
import { RedisModule } from "src/redis/redis.module";

@Module({
  providers: [PresenceService],
  exports: [PresenceService],
  controllers: [PresenceController],
  imports: [RedisModule]
})
export class PresenceModule {}
