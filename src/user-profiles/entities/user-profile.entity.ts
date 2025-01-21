import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserStatus } from "../enums/user-status.enum";

@Entity()
export class UserProfile {
    @PrimaryGeneratedColumn()
    id: number
    @Column({ name: 'display_name' })
    displayName: string;

    @Column({ nullable: true })
    pronouns?: string;

    @Column({ nullable: true })
    bio?: string;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.Offline
    })
    status: UserStatus;

    @Column({ nullable: true })
    profilePictureURL?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToOne(() => User)
    user: User;

    static create(profile: Partial<UserProfile>) {
        const ret = new UserProfile();
        ret.displayName = profile.displayName || '';
        ret.pronouns = profile.pronouns || undefined;
        ret.bio = profile.bio || undefined;
        ret.status = profile.status || UserStatus.Offline;  // Default to Offline if not provided
        ret.profilePictureURL = profile.profilePictureURL || undefined;
        ret.createdAt = profile.createdAt || new Date();  // You can provide default values if needed
        ret.updatedAt = profile.updatedAt || new Date();
        ret.user = profile.user || null;

        return ret;
    }
}
