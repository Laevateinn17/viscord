import { AutoMap } from "@automapper/classes";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Message } from "./message.entity";

@Entity()
export class Attachment {
    @AutoMap()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @AutoMap()
    @Column({name: 'message_id'})
    messageId?: string;

    @AutoMap()
    @Column()
    type: string;

    @AutoMap()
    @Column()
    url: string;

    @AutoMap()
    @ManyToOne(() => Message, (m) => m.attachments, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'message_id'})
    message: Message;
}