import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Channel } from "./channel.entity";
import { AutoMap } from "@automapper/classes";

@Entity()
export class UserChannelState {
    @PrimaryColumn('uuid', {name: 'channel_id'})
    channelId: string

    @PrimaryColumn('uuid', {name: 'user_id'})
    userId: string

    @AutoMap()
    @Column({name: 'last_read_id', nullable: true})
    lastReadId?: string

    @ManyToOne(() => Channel, (channel) => channel.userChannelState, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'channel_id'})
    channel: Channel
}