import { RtpCapabilities } from "mediasoup-client/types";

export interface CreateConsumerDTO {
    userId: string;
    transportId: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpCapabilities: RtpCapabilities;
}