import { forwardRef, Module } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceController } from './presence.controller';
import { RedisModule } from "src/redis/redis.module";
import { WsModule } from "src/ws/ws.module";

@Module({
  providers: [PresenceService],
  exports: [PresenceService],
  controllers: [PresenceController],
  imports: [RedisModule, forwardRef(() => WsModule)]
})
export class PresenceModule {}
