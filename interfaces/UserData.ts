import { UserProfile } from "./user-profile";

export interface UserData {
    id: string

    email: string;

    username: string;

    dateOfBirth: Date;

    profile: UserProfile
}