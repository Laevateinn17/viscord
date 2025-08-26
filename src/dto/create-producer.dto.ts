import { MediaKind, RtpParameters } from "mediasoup/types";

export interface CreateProducerDTO {
    transportId: string;
    channelId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
    paused: boolean;
    appData: any;
}