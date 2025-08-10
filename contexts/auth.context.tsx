"use client"
import { api } from "@/services/api";
import { refreshToken } from "@/services/auth/auth.service";
import axios, { AxiosInstance, HttpStatusCode } from "axios";
import { useRouter } from "next/navigation";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useRef, useState } from "react";

export interface AuthContextType {
    isAuthorized: boolean;
    handleRefreshToken: () => void;
}

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();


    const handleRefreshToken = async () => {
        const response = await refreshToken();

        setIsAuthorized(true);

        return response;
    };

    useEffect(() => {
        const refreshTokenInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error: any) => {
                if (error.response.status === HttpStatusCode.Unauthorized && !error.config._retry) {
                    error.config._retry = true;
                    try {
                        const response = await handleRefreshToken();
                        if (!response.success) {

                            router.push("/login");
                            return Promise.reject(error);
                        }
                        // if (userResponse.success) {
                        //     setUser(userResponse.data!);
                        // }

                        return api.request(error.config);
                    }
                    catch (error: any) {
                        router.push("/login");
                        return error.response;
                    }
                }

                return Promise.reject(error);
            });

        handleRefreshToken();

        // const addIdentityInterceptor = api.interceptors.request.use((config) => {
        //     if (accessToken) {
        //         config.headers.Authorization = `Bearer ${accessToken}`;
        //     }
        //     return config;
        // })

        return () => {
            api.interceptors.response.eject(refreshTokenInterceptor)
            // api.interceptors.request.eject(addIdentityInterceptor);
        }
    }, [])


    return (
        <AuthContext.Provider value={{ isAuthorized: isAuthorized, handleRefreshToken }}>
            {children}
        </AuthContext.Provider>
    );
}