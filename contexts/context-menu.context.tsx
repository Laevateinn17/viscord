import ContextMenu from "@/components/context-menu/context-menu";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import ContextMenuState from "@/interfaces/context-menu-state";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";

interface ContextMenuContextType {
    menuState: ContextMenuState | undefined;
    showMenu: (evt: React.MouseEvent, type: ContextMenuType, data: any) => void;
    hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType>(null!);

export function useContextMenu() {
    return useContext(ContextMenuContext);
}

const ClickTrapOverlay = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    inset: 0;
`

export function ContextMenuProvider({ children }: { children: ReactNode }) {
    const [menuState, setMenuState] = useState<ContextMenuState | undefined>();
    const menuRef = useRef<HTMLDivElement>(null!);
    function showMenu(evt: React.MouseEvent, type: ContextMenuType, data: any) {
        evt.preventDefault();
        setMenuState({
            x: evt.clientX,
            y: evt.clientY,
            visible: true,
            type: type,
            data: data
        });
    };

    function hideMenu() {
        setMenuState(undefined);
    }

    function handleOutsideClick(e: MouseEvent) {
        if (!menuRef.current.contains(e.target as Node)) {
            hideMenu();
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        }
    }, []);

    return (
        <ContextMenuContext.Provider value={{ menuState, showMenu, hideMenu }}>
            {children}
            {menuState && <ClickTrapOverlay />}
            <div ref={menuRef}>
                <ContextMenu />
            </div>
        </ContextMenuContext.Provider>
    );
}