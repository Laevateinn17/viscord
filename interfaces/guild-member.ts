import { UserProfile } from "./user-profile";

export interface GuildMember {
    userId: string;
    roles: string[];
    profile: UserProfile;
}