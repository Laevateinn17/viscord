import {} from "@nestjs/typeorm"
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Attachment } from "./attachment.entity"
import { AutoMap } from "@automapper/classes"
import { MessageMention } from "./message-mention.entity"

@Entity()
export class Message {
    @AutoMap()
    @PrimaryGeneratedColumn('uuid')
    id: string

    @AutoMap()
    @Column({name: 'sender_id'})
    senderId: string

    @AutoMap()
    @Column()
    content: string

    @AutoMap()
    @Column({name: 'channel_id'})
    channelId: string

    @AutoMap()
    @Column({default: false})
    is_pinned: boolean

    @AutoMap()
    @CreateDateColumn({name: 'created_at'})
    createdAt: Date

    @AutoMap()
    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date


    @OneToMany(() => MessageMention, (mm) => mm.message)
    mentions: MessageMention[]

    @OneToMany(() => Attachment, (a) => a.message)
    attachments: Attachment[]
}
