import { CreateDateColumn, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Guild } from "./guild.entity";

@Entity()
export class GuildMember {
    @PrimaryColumn('uuid')
    guildId: string;
    @PrimaryColumn('uuid')
    userId: string

    @ManyToOne(() => Guild, (guild) => guild.members, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    guild: Guild

    @CreateDateColumn()
    joinedAt: Date
}