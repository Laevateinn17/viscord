import { Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { Channel } from "./channel.entity";

@Entity()
export class ChannelRecipient {
    @PrimaryColumn('uuid', {name: 'channel_id'})
    channelId: string
    @PrimaryColumn('uuid', {name: 'user_id'})
    userId: string

    @ManyToOne(() => Channel, (channel) => channel.recipients, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'channel_id'})
    channel?: Channel
}