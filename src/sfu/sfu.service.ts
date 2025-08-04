import { HttpService } from "@nestjs/axios";
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from "rxjs";
import { ConnectTransportDTO } from "./dto/connect-transport.dto";

@Injectable()
export class SfuService {
    private endpoint = `${process.env.SFU_SERVICE_HOST}:${process.env.SFU_SERVICE_PORT}`;

    constructor(private readonly httpService: HttpService) {
    }

    async createTransport() {
        return await firstValueFrom(this.httpService.post(`http://${this.endpoint}/create-transport`));
    }

    async connectTransport(dto: ConnectTransportDTO) {
        return await firstValueFrom(this.httpService.post(`http://${this.endpoint}/connect-transport`, dto))
    }

    async getRTPCapabilities() {
        return await firstValueFrom(this.httpService.get(`http://${this.endpoint}/rtp-capabilities`));
    }

    async createProducer(dto: any) {
        return await firstValueFrom(this.httpService.post(`http://${this.endpoint}/producer`, dto));
    }

    async createConsumer(dto: any) {
        return await firstValueFrom(this.httpService.post(`http://${this.endpoint}/consumer`, dto));
    }

}
