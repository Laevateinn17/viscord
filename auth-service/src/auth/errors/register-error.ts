import { ErrorResponse } from "./error-response";

export interface RegisterError extends ErrorResponse{
    email?: string
    displayName?: string;
    username?: string;
    password?: string;
    dateOfBirth?: string;
}