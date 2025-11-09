import { Observable } from "rxjs";
import { AcknowledgeMessageDTO } from "src/channels/dto/acknowledge-message.dto";
import { Result } from "src/interfaces/result.interface";
import { ChannelResponseDTO } from "./dto/channel-response.dto";

export interface ChannelsService {
    acknowledgeMessage(data: AcknowledgeMessageDTO): Observable<Result<null>>;
    getChannelById({userId, channelId}: {userId: string, channelId: string}): Observable<Result<ChannelResponseDTO>>;
    isUserChannelParticipant({userId, channelId}: {userId: string, channelId: string}): Observable<Result<null>>;
}