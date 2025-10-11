
export interface Role {
    id: string;
    name: string
    permissions: string;
    position: number;
    isHoisted: boolean;
    guildId: string;
    color?: number;
}