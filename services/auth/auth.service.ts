import axios, { AxiosError, HttpStatusCode } from "axios";
import { LoginDTO } from "../../interfaces/dto/login.dto";
import { AuthResponseDTO } from "@/interfaces/dto/auth-response.dto";
import { Response } from "@/interfaces/response";

const ENDPOINT = process.env.NEXT_PUBLIC_API_URL + '/auth';
export async function login(dto: LoginDTO): Promise<Response<AuthResponseDTO | null>> {
    try {
        console.log(dto)
        const response = await axios.post(ENDPOINT + '/login', dto);
        console.log(response);
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<AuthResponseDTO>({
                data: { accessToken: response.data.data.accessToken },
                message: response.data.message
            });
        }
        return Response.Failed<null>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log(error.response);
            return Response.Failed<null>({
                message: error.response ? error.response.data.message as string : "Error"
            });
        }

        return Response.Failed<null>({
            message: "An unknown error occurred."
        })
    }
}