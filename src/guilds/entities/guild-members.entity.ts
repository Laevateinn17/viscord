import { CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { Guild } from "./guild.entity";
import { Role } from "src/roles/entities/role.entity";

@Entity()
export class GuildMember {
    @PrimaryColumn('uuid')
    guildId: string;
    @PrimaryColumn('uuid')
    userId: string;

    @ManyToOne(() => Guild, (guild) => guild.members, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    guild: Guild;

    @CreateDateColumn()
    joinedAt: Date;

    @ManyToMany(() => Role)
    @JoinTable()
    roles: Role[]
}