
export interface ConsumerCreatedDTO {
    id: string;
    producerId: string;
    userId: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
}