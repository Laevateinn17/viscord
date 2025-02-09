import { AutoMap } from "@automapper/classes";
import { UserStatus } from "../enums/user-status.enum";

export class UserProfileResponseDTO {
    @AutoMap()
    id: number

    @AutoMap()
    displayName: string;
    
    @AutoMap()
    pronouns?: string;
    
    @AutoMap()
    bio?: string;
    
    @AutoMap()
    status: UserStatus;
    
    @AutoMap()
    profilePictureURL?: string;
    
    @AutoMap()
    createdAt: Date;
    
    @AutoMap()
    updatedAt: Date;
}