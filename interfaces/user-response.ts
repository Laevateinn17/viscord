import { UserProfile } from "./user-profile";

export interface UserResponse {
    id: string;

    email: string;
    
    dateOfBirth: Date;

    profile: UserProfile;
}