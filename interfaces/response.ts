import { ErrorResponse } from "./errors/error-response";

export class Response<T> {
    success: boolean
    data?: T
    message: string | ErrorResponse

    constructor({ success, data, message}: {success: boolean, data?: T, message: string | ErrorResponse}) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    static Success<T>({ data, message}: {data: T, message: string}) {
        return new Response<T>({ success: true, data: data, message: message });
    }

    static Failed<T>({ data, message}: {data?: T, message: string | ErrorResponse}) {
        return new Response<T>  ({ success: false, data: data, message: message });
    }
}