import { Channel } from "../channel";
import Relationship from "../relationship";
import { UserData } from "../user-data";

export interface ClientReadyResponseDTO {
    user: UserData;
    relationships?: Relationship[];
    presences: string[];
    dmChannels?: Channel[];
}