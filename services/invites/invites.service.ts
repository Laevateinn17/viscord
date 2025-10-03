import { AxiosError, HttpStatusCode } from "axios";
import { api } from "../api";
import { Response } from "@/interfaces/response";

const INVITE_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/invites`

export async function deleteInvite(inviteId: string): Promise<Response<null>> {
    try {
        const response = await api.delete(`${INVITE_ENDPOINT}/${inviteId}/`, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.NoContent) {
            return Response.Success({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    })

}