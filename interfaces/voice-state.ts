export class VoiceState {
  userId: string;
  channelId: string;
  isMuted: boolean;
  isDeafened: boolean;

  constructor(
    userId: string,
    channelId: string,
    isMuted: boolean = false,
    isDeafened: boolean = false
  ) {
    this.userId = userId;
    this.channelId = channelId;
    this.isMuted = isMuted;
    this.isDeafened = isDeafened;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  toggleDeafen() {
    this.isDeafened = !this.isDeafened;
  }
}