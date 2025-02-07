"use client"
import { createContext, ReactNode, useContext, useState } from "react";

export interface AuthContextType {
    setToken: (token: string | null) => any
    token: string | null
}

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({children}: {children: ReactNode}) {
    const [token, setToken] = useState<string | null>(null)
    
    return (
        <AuthContext.Provider value={{token, setToken}}>
            {children}
        </AuthContext.Provider>
    );
}