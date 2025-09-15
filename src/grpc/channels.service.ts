import { Observable } from "rxjs";
import { AcknowledgeMessageDTO } from "src/channels/dto/acknowledge-message.dto";
import { Result } from "src/interfaces/result.interface";

export interface ChannelsService {
    acknowledgeMessage(data: AcknowledgeMessageDTO): Observable<Result<null>>;
}