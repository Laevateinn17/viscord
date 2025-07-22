import { Guild } from "@/interfaces/guild";
import { api } from "../api";
import { AxiosError, HttpStatusCode } from "axios";
import { Response } from "@/interfaces/response";
import { CreateGuildDto } from "@/interfaces/dto/create-guild.dto";
import { formatDynamicAPIAccesses } from "next/dist/server/app-render/dynamic-rendering";


const ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/guilds`
export async function createGuild(dto: CreateGuildDto): Promise<Response<Guild>> {
    const formData = new FormData();
    if (dto.iconImage) {
        formData.append("icon", dto.iconImage);
    }
    formData.append("name", dto.name);

    try {
        const response = await api.post(ENDPOINT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Created) {
            return Response.Success<Guild>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Guild>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Guild>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Guild>({
        message: "An unknown error occurred."
    })
}

export async function getGuilds() {
     try {
        const response = await api.get(`${ENDPOINT}`, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<Guild[]>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Guild[]>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Guild[]>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Guild[]>({
        message: "An unknown error occurred."
    })   
}

export async function getGuildDetail(guildId: string): Promise<Response<Guild>> {
     try {
        const response = await api.get(`${ENDPOINT}/${guildId}`, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<Guild>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Guild>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Guild>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Guild>({
        message: "An unknown error occurred."
    })   
}