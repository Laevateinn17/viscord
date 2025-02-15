"use client"
import { UserData } from "@/interfaces/UserData";
import { api } from "@/services/api";
import { refreshToken } from "@/services/auth/auth.service";
import { getCurrentUserData } from "@/services/users/users.service";
import axios, { AxiosInstance, HttpStatusCode } from "axios";
import { responseCookiesToRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { useRouter } from "next/navigation";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useRef, useState } from "react";

export interface AuthContextType {
    user: UserData | undefined
    getUser: () => Promise<UserData | undefined>
    setUser: Dispatch<SetStateAction<UserData | undefined>>
}

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
    return useContext(AuthContext);
}


export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | undefined>(undefined)
    const router = useRouter();

    useEffect(() => {
        console.log("user state ", user);
    }, [user])

    async function getUser(): Promise<UserData | undefined> {
        console.log("getting user")
        if (!user) {
            const response = await getCurrentUserData();
            if (response.success) {
                setUser(response.data!);
                return response.data;
            }
        }
        return user;
    }


    useEffect(() => {
        const refreshTokenInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error: any) => {
                if (error.response.status === HttpStatusCode.Unauthorized && !error.config._retry) {
                    console.log("refreshing token")
                    error.config._retry = true;
                    try {
                        const response = await refreshToken();
                        if (!response.success) {

                            router.push("/login");
                            return Promise.reject(error);
                        }
                        // const newToken = response.data?.accessToken;
                        // tokenRef.current = newToken ?? null;
                        // error.config.headers['Authorization'] = `Bearer ${newToken}`;

                        const userResponse = await getCurrentUserData();
                        console.log("token received ", userResponse.data);

                        if (userResponse.success) {
                            setUser(userResponse.data!);
                        }

                        return api.request(error.config);
                    }
                    catch (error: any) {
                        router.push("/login");
                        return error.response;
                    }
                }

                return Promise.reject(error);
            });


        getUser();
        // const addIdentityInterceptor = api.interceptors.request.use((config) => {
        //     const token = tokenRef.current;
        //     console.log('attaching access token', token);
        //     if (token) {
        //         config.headers.Authorization = `Bearer ${token}`;
        //     }
        //     return config;
        // })

        return () => {
            api.interceptors.response.eject(refreshTokenInterceptor)
            // api.interceptors.request.eject(addIdentityInterceptor);
        }
    }, [])


    return (
        <AuthContext.Provider value={{ user, getUser, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}