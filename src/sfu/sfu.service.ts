import { HttpService } from "@nestjs/axios";
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from "rxjs";
import { ConncetTransportDTO } from "./dto/connect-transport.dto";

@Injectable()
export class SfuService {
    private endpoint = `${process.env.SFU_SERVICE_HOST}:${process.env.SFU_SERVICE_PORT}`;

    constructor(private readonly httpService: HttpService) {
    }

    async createTransport(channelId: string) {
        return await firstValueFrom(this.httpService.post(`http://${this.endpoint}/create-transport`, { channelId }));
    }

    async connectTransport(dto: ConncetTransportDTO) {
        return await firstValueFrom(this.httpService.post(`http://${this.endpoint}/connect-transport`, dto))
    }

}
