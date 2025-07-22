import { createContext, Dispatch, ReactNode, SetStateAction, useCallback, useContext, useEffect, useState } from "react";

interface AppStateContextType {
    isLoading: boolean
    setIsLoading: Dispatch<SetStateAction<boolean>>
    a: number
    setA: Dispatch<SetStateAction<number>>
}

const AppStateContext = createContext<AppStateContextType>(null!);

export function useAppState() {
    return useContext(AppStateContext);
}


export default function AppStateProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [a, setA] = useState(0);
    useEffect(() => {
    })
    return (
        <AppStateContext.Provider value={{ isLoading, setIsLoading, a, setA }}>
            {children}
        </AppStateContext.Provider>
    )
}