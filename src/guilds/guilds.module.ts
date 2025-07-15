import { Module } from '@nestjs/common';
import { WsModule } from "src/ws/ws.module";

@Module({
    imports: [WsModule]
})
export class GuildsModule {}
