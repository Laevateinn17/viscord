
export interface ProducerCreatedDTO {
    producerId: string;
    userId: string;
    channelId: string;
    kind: 'audio' | 'video';
}