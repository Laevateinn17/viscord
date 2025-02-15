import axios, { AxiosError, HttpStatusCode } from "axios";
import { LoginDTO } from "../../interfaces/dto/login.dto";
import { AuthResponse } from "@/interfaces/auth-response";
import { Response } from "@/interfaces/response";
import { RegisterDTO } from "@/interfaces/dto/register.dto";
import { api } from "../api";
import { RegisterError } from "@/interfaces/errors/register-error";

const ENDPOINT = process.env.NEXT_PUBLIC_API_URL + '/auth';
export async function login(dto: LoginDTO): Promise<Response<AuthResponse | null>> {
    try {
        const response = await api.post(ENDPOINT + '/login', dto, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<AuthResponse>({
                data: {},
                message: response.data.message
            });
        }
        return Response.Failed<null>({
            message: response.data.message
        });
    } catch (error) {
        console.log(error)
        if (error instanceof AxiosError) {
            return Response.Failed<null>({
                message: error.response ? error.response.data.message as string : "Error"
            });
        }

        return Response.Failed<null>({
            message: "An unknown error occurred."
        })
    }
}

export async function register(dto: RegisterDTO): Promise<Response<AuthResponse>> {
    try {
        const response = await api.post(ENDPOINT + '/register', dto, {
            withCredentials: true
        });
        console.log(response)
        if (response.status === HttpStatusCode.Created) {
            return Response.Success<AuthResponse>({
                data: {},
                message: response.data.message as string
            });
        }
        return Response.Failed<AuthResponse>({
            message: new RegisterError(response.data.message)
        });
    } catch (error) {
        if (error instanceof AxiosError) {
            return Response.Failed<AuthResponse>({
                message: error.response ? new RegisterError(error.response.data.message) : "An unknown Error occurred"
            });
        }

        return Response.Failed<AuthResponse>({
            message: "An unknown error occurred."
        })
    }
}

export async function refreshToken(): Promise<Response<AuthResponse>> {
    try {
        const response = await axios.post(ENDPOINT + '/refresh-token', {}, {
            withCredentials: true,
            timeout: 10000
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<AuthResponse>({
                data: {},
                message: response.data.message
            });
        }
        return Response.Failed<AuthResponse>({
            message: response.data.message
        });
    } catch (error) {
        console.log(error)
        if (error instanceof AxiosError) {
            return Response.Failed<AuthResponse>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
        }

        return Response.Failed<AuthResponse>({
            message: "An unknown error occurred."
        })
    }
}

export async function logout() {
    try {
        const response = await api.post(ENDPOINT + '/logout', null, {
            withCredentials: true,
        });
        if (response.status === HttpStatusCode.Created) {
            return Response.Success<AuthResponse>({
                data: {},
                message: response.data.message as string
            });
        }
        return Response.Failed<AuthResponse>({
            message: new RegisterError(response.data.message)
        });
    } catch (error) {
        if (error instanceof AxiosError) {
            return Response.Failed<AuthResponse>({
                message: error.response ? new RegisterError(error.response.data.message) : "An unknown Error occurred"
            });
        }

        return Response.Failed<AuthResponse>({
            message: "An unknown error occurred."
        })
    }

}