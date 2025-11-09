import { AutoMap } from "@automapper/classes";
import { UserProfileResponseDTO } from "src/user-profiles/dto/user-profile-response.dto";

export class GuildMemberResponseDTO {
    @AutoMap()
    userId: string;

    @AutoMap()
    roles: string[];

    @AutoMap()
    profile: UserProfileResponseDTO;
}