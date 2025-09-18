import { Injectable } from '@nestjs/common';
import { USER_PRESENCE_TTL } from "src/constants/redis-configs";
import { RedisService } from "src/redis/redis.service";

@Injectable()
export class PresenceService {
    constructor(
        private readonly redisService: RedisService
    ) { }


    async setUserPresence(userId: string): Promise<boolean> {
        try {
            const client = await this.redisService.getClient();
            const key = this.getUserPresenceKey(userId);
            client.setEx(key, USER_PRESENCE_TTL, userId);
        } catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }

    async deleteUserPresence(userId: string): Promise<boolean> {
        try {
            const client = await this.redisService.getClient();
            const key = this.getUserPresenceKey(userId);
            client.del(key);
        } catch (error) {
            console.error(error);
            return false;
        }

        return true;

    }

    async getUserPresence(userIds: string[]): Promise<(string | null)[]> {
        try {
            const client = await this.redisService.getClient();
            const presences = await client.mGet(userIds.map(id => this.getUserPresenceKey(id)));
            return presences.map(p => p ? p as string : null);
            
        } catch (error) {
            console.error(error);
        }

        return [];
    }

    private getUserPresenceKey(userId: string) {
        return `presence:${userId}`
    }

}
