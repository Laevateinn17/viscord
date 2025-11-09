
export interface Invite {
    id: string;
    code: string;
    maxAge: number | null;
    inviterId: string;
    channelId: string;
    guildId?: string;
    createdAt: string;
    expiresAt: string;
}