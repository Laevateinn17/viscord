import { Observable } from "rxjs";
import { UserProfileResponseDTO } from "../dto/user-profile-response.dto";
import { Result } from "src/interfaces/result.interface";


export interface UserProfilesService {
    getUserProfiles({userIds}: {userIds: string[]}): Observable<Result<UserProfileResponseDTO[]>>
}