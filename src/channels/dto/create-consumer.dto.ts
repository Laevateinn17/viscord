
export interface CreateConsumerDTO {
    userId: string;
    transportId: string;
    channelId: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
}