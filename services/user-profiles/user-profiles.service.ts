import { UserStatus } from "@/enums/user-status.enum";
import { api } from "../api";
import { AxiosError, HttpStatusCode } from "axios";
import { UserData } from "@/interfaces/user-data";
import { Response } from "@/interfaces/response";

const ENDPOINT = process.env.NEXT_PUBLIC_API_URL + '/user-profiles'

export async function updateStatus(status: UserStatus) {
    try {
        const response = await api.patch(ENDPOINT + '/status', { //TODO change to dto
            status: status
        }, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<null>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<UserData>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<null>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<null>({
        message: "An unknown error occurred."
    })
}