import { AutoMap } from "@automapper/classes";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";
import { PermissionOverwriteTargetType } from "../enums/permission-overwrite-target-type.enum";
import { Channel } from "./channel.entity";

@Unique(['channelId', 'targetId'])
@Entity()
export class PermissionOverwrite {
    @AutoMap()
    @Column({
        type: 'bigint',
        default: 0,
        transformer: {
            to: (value?: bigint | null): string | null => {
                if (value === null || value === undefined) return null;
                return value.toString();
            },
            from: (value?: string | null): bigint | null => {
                if (value === null || value === undefined) return BigInt(0);
                return BigInt(value);
            },
        },
    })
    allow: bigint;

    @AutoMap()
    @Column({
        type: 'bigint',
        default: 0,
        transformer: {
            to: (value?: bigint | null): string | null => {
                if (value === null || value === undefined) return null;
                return value.toString();
            },
            from: (value?: string | null): bigint | null => {
                if (value === null || value === undefined) return BigInt(0);
                return BigInt(value);
            },
        },
    })
    deny: bigint;

    @AutoMap()
    @PrimaryColumn({ name: 'target_id' })
    targetId: string

    @AutoMap()
    @Column({ name: 'target_type', type: 'enum', enum: PermissionOverwriteTargetType })
    targetType: PermissionOverwriteTargetType

    @AutoMap()
    @PrimaryColumn  ({ name: 'channel_id' })
    channelId: string

    @AutoMap()
    @ManyToOne(() => Channel, (channel) => channel.permissionOverwrites, { onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    @JoinColumn({ name: 'channel_id' })
    channel: Channel;

}