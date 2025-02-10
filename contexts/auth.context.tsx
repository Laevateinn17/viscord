"use client"
import { UserData } from "@/interfaces/UserData";
import { api } from "@/services/api";
import { refreshToken } from "@/services/auth/auth.service";
import { getCurrentUserData } from "@/services/users/users.service";
import axios, { AxiosInstance, HttpStatusCode } from "axios";
import { responseCookiesToRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

export interface AuthContextType {
    setToken: (token: string | null) => any
    token: string | null
    user: UserData | null
}

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
    return useContext(AuthContext);
}


export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null)
    const [user, setUser] = useState<UserData | null>(null)
    const tokenRef = useRef<string | null>(token)
    const router = useRouter();

    useEffect(() => {
        if (tokenRef.current) {
            setToken(tokenRef.current)
        }
    }, [tokenRef.current])

    useEffect(() => {
        if (token) {
            getCurrentUserData().then(response => {
                if (response.success) {
                    setUser(response.data!);
                }
            });
        }
    }, [token])

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

                        const newToken = response.data?.accessToken;
                        tokenRef.current = newToken ?? null;
                        error.config.headers['Authorization'] = `Bearer ${newToken}`;

                        return api.request(error.config);
                    }
                    catch (error: any) {
                        router.push("/login");
                        return error.response;
                    }
                }

                return Promise.reject(error);
            });
        const addIdentityInterceptor = api.interceptors.request.use((config) => {
            const token = tokenRef.current;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        })

        
        getCurrentUserData().then(response => {
            if (!response.success) {
                router.push("/login")
            }
            setUser(response.data!);
        })
        return () => {
            api.interceptors.response.eject(refreshTokenInterceptor)
            api.interceptors.request.eject(addIdentityInterceptor);
        }
    }, [])


    return (
        <AuthContext.Provider value={{ token, setToken, user }}>
            {children}
        </AuthContext.Provider>
    );
}