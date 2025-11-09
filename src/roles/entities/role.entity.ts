import { AutoMap } from "@automapper/classes";
import { Guild } from "src/guilds/entities/guild.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Role {
    @PrimaryGeneratedColumn('uuid')
    @AutoMap()
    id: string;

    @AutoMap()
    @Column()
    name: string;

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
    permissions: bigint;

    @AutoMap()
    @Column({ default: 0 })
    position: number;

    @AutoMap()
    @Column({ name: 'is_hoisted', default: false })
    isHoisted: boolean;

    @AutoMap()
    @Column({nullable: true})
    color?: number

    @AutoMap()
    @Column({ name: 'guild_id' })
    guildId: string;

    @AutoMap()
    @ManyToOne(() => Guild, g => g.roles, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'guild_id' })
    guild: Guild;

}
