"use client"
import { UserStatus } from "@/enums/user-status.enum";
import { UserData } from "@/interfaces/user-data";
import { api } from "@/services/api";
import { refreshToken } from "@/services/auth/auth.service";
import { getCurrentUserData, updateStatus } from "@/services/users/users.service";
import axios, { AxiosInstance, HttpStatusCode } from "axios";
import { useRouter } from "next/navigation";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useRef, useState } from "react";

export interface AuthContextType {
}

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
    return useContext(AuthContext);
}


export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | undefined | null>(null)
    const router = useRouter();

    // useEffect(() => {
    //     console.log("user state ", user);
    // }, [user])

    async function getUser(): Promise<UserData | undefined | null> {
        if (!user) {
            const response = await getCurrentUserData();
            if (response.success) {
                const user = response.data!;
                user.profile.isOnline = true;
                setUser(response.data!);
                return response.data;
            }
            setUser(undefined);
        }
        return user;
    }


    useEffect(() => {
        const refreshTokenInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error: any) => {
                if (error.response.status === HttpStatusCode.Unauthorized && !error.config._retry) {
                    error.config._retry = true;
                    try {
                        const response = await refreshToken();
                        if (!response.success) {

                            router.push("/login");
                            return Promise.reject(error);
                        }

                        const userResponse = await getUser();
                        // console.log("token received ", userResponse.data);

                        // if (userResponse.success) {
                        //     setUser(userResponse.data!);
                        // }

                        return api.request(error.config);
                    }
                    catch (error: any) {
                        setUser(undefined);
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
        <AuthContext.Provider value={{}}>
            {children}
        </AuthContext.Provider>
    );
}