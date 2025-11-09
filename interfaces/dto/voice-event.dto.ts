import { VoiceEventType } from "@/enums/voice-event-type"

export interface VoiceEventDTO {
    channelId: string
    userId: string
    type: VoiceEventType
    data?: any
}