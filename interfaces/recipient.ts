import { UserProfile } from "./user-profile";


export interface Recipient {
    userProfile: UserProfile
    isTyping: boolean
}