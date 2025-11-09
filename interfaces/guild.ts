import { Channel } from "./channel";
import { GuildMember } from "./guild-member";
import { Role } from "./role";
import { UserProfile } from "./user-profile";

export interface Guild {
    id: string;
    name: string;
    ownerId: string;
    iconURL?: string;
    channels: Channel[]
    createdAt: Date
    updatedAt: Date
    members: GuildMember[];
    roles: Role[];
}