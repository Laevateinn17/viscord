import { Column, CreateDateColumn, Entity, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserStatus } from "../enums/user-status.enum";
import { AutoMap } from "@automapper/classes";

@Entity({name: 'user_profile'})
export class UserProfile {
    @AutoMap()
    @PrimaryColumn()
    id: string

    @AutoMap()
    @Column({ name: 'display_name' })
    displayName: string;

    @AutoMap()
    @Column({ nullable: true })
    pronouns?: string;

    @AutoMap()
    @Column({ nullable: true })
    bio?: string;

    @AutoMap()
    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.Offline
    })
    status: UserStatus;

    @AutoMap()
    @Column({ nullable: true })
    profilePictureURL?: string;

    @AutoMap()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @AutoMap()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    static create(profile: Partial<UserProfile>) {
        const ret = new UserProfile();
        ret.displayName = profile.displayName || '';
        ret.pronouns = profile.pronouns || undefined;
        ret.bio = profile.bio || undefined;
        ret.status = profile.status || UserStatus.Offline;  // Default to Offline if not provided
        ret.profilePictureURL = profile.profilePictureURL || undefined;
        ret.createdAt = profile.createdAt || new Date();  // You can provide default values if needed
        ret.updatedAt = profile.updatedAt || new Date();

        return ret;
    }
}
