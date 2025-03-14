import { Channel } from "src/channels/entities/channel.entity";
import { Column, CreateDateColumn, Entity, JoinTable, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { GuildMember } from "./guild-members.entity";
import { AutoMap } from "@automapper/classes";

@Entity()
export class Guild {
    @AutoMap()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @AutoMap()
    @Column()
    name: string;

    @AutoMap()
    @Column({ name: 'owner_id' })
    ownerId: string;

    @AutoMap()
    @Column({ name: 'icon_url', nullable: true})
    iconURL?: string;

    @AutoMap()
    @Column({default: false})
    isPrivate: boolean

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date


    @OneToMany(() => GuildMember, (member) => member.guild)
    members: GuildMember[];

    @AutoMap()
    @OneToMany(() => Channel, (channel) => channel.guild)
    channels: Channel[]
}