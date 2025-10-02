import { AutoMap } from "@automapper/classes";
import { Channel } from "src/channels/entities/channel.entity";
import { Guild } from "src/guilds/entities/guild.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity()
export class Invite {
    @AutoMap()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @AutoMap()
    @Column({unique: true})
    code: string;

    @AutoMap()
    @Column({name: 'inviter_id'})
    inviterId: string;

    @AutoMap()
    @Column({name: 'channel_id'})
    channelId: string;
    
    @AutoMap()
    @Column({name: 'guild_id', nullable: true})
    guildId?: string;

    @AutoMap()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @AutoMap()
    @Column({name: 'expired_at', nullable: true})
    expiresAt?: Date;

    @ManyToOne(() => Channel, (channel) => channel.invites, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    @JoinColumn({name: 'channel_id'})
    channel: Channel;

    @ManyToOne(() => Guild, (guild) => guild.invites, { nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({name: 'guild_id'})
    guild?: Guild;
}
