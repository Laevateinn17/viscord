import ContextMenu from "@/components/context-menu/context-menu";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import ContextMenuState from "@/interfaces/context-menu-state";
import { createContext, ReactNode, useContext, useState } from "react";

interface ContextMenuContextType {
    menuState: ContextMenuState | undefined;
    showMenu: (evt: React.MouseEvent, type: ContextMenuType, data: any) => void;
    hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType>(null!);

export function useContextMenu() {
    return useContext(ContextMenuContext);
}

export function ContextMenuProvider({ children }: {children: ReactNode}) {
    const [menuState, setMenuState] = useState<ContextMenuState | undefined>();

    const showMenu = (evt: React.MouseEvent, type: ContextMenuType, data: any) => {
        evt.preventDefault();
        setMenuState({
            x: evt.clientX,
            y: evt.clientY,
            visible: true,
            type: type,
            data: data
        });
    };

    const hideMenu = () => setMenuState(undefined);

    return (
        <ContextMenuContext.Provider value={{menuState, showMenu, hideMenu}}>
            {children}
            <ContextMenu/>
        </ContextMenuContext.Provider>
    );
}