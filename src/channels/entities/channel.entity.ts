import { Guild } from "src/guilds/entities/guild.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ChannelType } from "../enums/channel-type.enum";
import { ChannelRecipient } from "./channel-recipient.entity";
import { AutoMap } from "@automapper/classes";
import { UserChannelState } from "./user-channel-state.entity";
import { Invite } from "src/invites/entities/invite.entity";
import { PermissionOverwrite } from "./permission-overwrite.entity";

@Entity()
export class Channel {
    @AutoMap()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @AutoMap()
    @Column({ nullable: true })
    name?: string;

    @Column({ name: 'owner_id' })
    ownerId: string;

    @AutoMap()
    @Column({
        type: 'enum',
        enum: ChannelType,
        default: ChannelType.Text
    })
    type: ChannelType;

    @AutoMap()
    @Column({ name: 'parent_id', nullable: true })
    parentId?: string;

    @AutoMap()
    @Column({ name: 'guild_id', nullable: true })
    guildId: string;

    @AutoMap()
    @Column({ name: 'last_message_id', nullable: true })
    lastMessageId?: string;

    @AutoMap()
    @Column({name: 'is_synced', default: true})
    isSynced: boolean;

    @AutoMap()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @AutoMap()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @AutoMap()
    @ManyToOne(() => Channel, (channel) => channel.children, { nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'parent_id' })
    parent?: Channel;

    @OneToMany(() => Channel, (channel) => channel.parent, { nullable: true })
    children?: Channel[];

    @ManyToOne(() => Guild, (guild) => guild.channels, { nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'guild_id' })
    guild?: Guild;

    @OneToMany(() => ChannelRecipient, (recipient) => recipient.channel)
    recipients: ChannelRecipient[];

    @OneToMany(() => UserChannelState, (userChannelState) => userChannelState.channel)
    userChannelState: UserChannelState[];

    @OneToMany(() => Invite, (invite) => invite.channel)
    invites: Invite[];

    @OneToMany(() => PermissionOverwrite, (po) => po.channel)
    permissionOverwrites: PermissionOverwrite[];
}