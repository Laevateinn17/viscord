import { ContextMenuType } from "@/enums/context-menu-type.enum";

export default interface ContextMenuState {
    x: number;
    y: number;
    visible: boolean;
    type: ContextMenuType;
    data: any;
}