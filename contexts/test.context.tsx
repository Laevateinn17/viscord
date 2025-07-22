import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";


interface TestContextType {
    num: number
    setNum: Dispatch<SetStateAction<number>>
}

const TestContext = createContext<TestContextType>(null!);

export function useTest() {
    return useContext(TestContext);
}

export function TestProvider({children} : {children: ReactNode}) {
    const [num, setNum] = useState(0);

    return <TestContext.Provider value={{num ,setNum}}>
        {children}
    </TestContext.Provider>
}