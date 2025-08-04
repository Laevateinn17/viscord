import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Channel } from "./channel.entity";

@Entity()
export class UserReadState {
    @PrimaryColumn('uuid', {name: 'channel_id'})
    channelId: string

    @PrimaryColumn('uuid', {name: 'user_id'})
    userId: string

    @Column({name: 'last_message_id'})
    lastMessageId: string

    @ManyToOne(() => Channel, (channel) => channel.userReadState, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'channel_id'})
    channel: Channel
}