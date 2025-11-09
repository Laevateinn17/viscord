export interface CreateInviteDto {
    channelId?: string;
    guildId: string;
    maxAge: number | null;
}
