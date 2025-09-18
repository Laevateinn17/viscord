import { Observable } from "rxjs";


export interface UsersService {
    getCurrentUser({userId}: {userId: string}): Observable<any>;
}