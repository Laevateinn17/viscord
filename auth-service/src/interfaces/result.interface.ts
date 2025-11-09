import { ErrorResponse } from "src/auth/errors/error-response";

export interface Result<T> {
    status: number;
    message: string | ErrorResponse;
    data: T | null
}