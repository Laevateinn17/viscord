import { Response } from "@/interfaces/response";
import { UserData } from "@/interfaces/user-data";
import axios, { AxiosError, HttpStatusCode } from "axios";
import { api } from "../api";
import { UserStatus } from "@/enums/user-status.enum";

const ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/users`

export async function getCurrentUserData(): Promise<Response<UserData>> {
    try {
        const response = await api.get(ENDPOINT + '/current', {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<UserData>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<UserData>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<UserData>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<UserData>({
        message: "An unknown error occurred."
    })
}
