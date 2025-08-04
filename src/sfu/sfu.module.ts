import { HttpModule } from "@nestjs/axios";
import { Module } from '@nestjs/common';
import { SfuService } from "./sfu.service";

@Module({
    providers: [SfuService],
    imports: [HttpModule],
    exports: [SfuService]
})
export class SfuModule {}
