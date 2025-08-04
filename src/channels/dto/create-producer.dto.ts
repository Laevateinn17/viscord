
export interface CreateProducerDTO {
    userId: string;
    channelId: string;
    kind: 'audio' | 'video';
    rtpParameters: any; 
}