import { Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { Message } from "./message.entity";
import {AutoMap} from '@automapper/classes'

@Entity()
export class MessageMention {
    @AutoMap()
    @PrimaryColumn({name: 'message_id'})
    messageId: string

    @AutoMap()
    @PrimaryColumn({name: 'user_id'})
    userId: string

    @AutoMap()
    @ManyToOne(() => Message, (m) => m.mentions)
    @JoinColumn({name: 'message_id'})
    message: Message
}