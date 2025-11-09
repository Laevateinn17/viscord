import { Observable } from "rxjs";
import { GetUnreadCountDTO } from "./dto/get-unread-count.dto";
import { Result } from "src/interfaces/result.interface";

export interface MessagesService {
    getUnreadCount(dto: GetUnreadCountDTO): Observable<Result<number>>;
}