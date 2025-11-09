import { Observable } from "rxjs";
import { CheckPermissionDTO } from "./dto/check-permission.dto";
import { CheckPermissionResponseDTO } from "./dto/check-permission-response.dto";

export interface GuildsService {
    checkPermission(dto: CheckPermissionDTO): Observable<CheckPermissionResponseDTO>
}