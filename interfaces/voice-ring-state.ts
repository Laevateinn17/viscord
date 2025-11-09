
export class VoiceRingState {
  initiatorId: string;
  channelId: string;
  recipientId: string;

  constructor(initiatorId: string, channelId: string, recipientId: string) {
    this.initiatorId = initiatorId;
    this.channelId = channelId;
    this.recipientId = recipientId;
  }
}