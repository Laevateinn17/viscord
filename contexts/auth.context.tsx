"use client"
import { useCurrentUserStore } from "@/app/stores/current-user-store";
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
    const { isAuthorized } = useCurrentUserStore();
    const router = useRouter();


    const handleRefreshToken = async () => {
        const { setIsAuthorized } = useCurrentUserStore.getState();
        const response = await refreshToken();
        if (!response.success) {
            setIsAuthorized(false);
            router.push('/login');
            return response;
        }

        setIsAuthorized(true)
        return response;
    };

    useEffect(() => {
        const refreshTokenInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error: any) => {
                if (error.response.status === HttpStatusCode.Unauthorized && !error.config._retry) {
                    error.config._retry = true;
                    const response = await handleRefreshToken();
                    if (!response.success) {
                        return Promise.reject(error);
                    }
                    return api.request(error.config);
                }

                return Promise.reject(error);
            });
        handleRefreshToken();

        return () => {
            api.interceptors.response.eject(refreshTokenInterceptor)
            // api.interceptors.request.eject(addIdentityInterceptor);
        }
    }, [])


    return (
        <AuthContext.Provider value={{ isAuthorized, handleRefreshToken }}>
            {children}
        </AuthContext.Provider>
    );
}