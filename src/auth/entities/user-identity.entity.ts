import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AccountStatus } from "../enums/account-status.enum";
import { AutoMap } from "@automapper/classes";

@Entity()
export class UserIdentity {
    @AutoMap()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @AutoMap()
    @Column()
    email: string;

    @AutoMap()
    @Column()
    password: string;
    
    @AutoMap()
    @Column()
    dateOfBirth: Date;

    @AutoMap()
    @Column({
        type: 'enum',
        enum: AccountStatus,
        default: AccountStatus.Active
    })
    status: AccountStatus;

    // @AutoMap()
    // @OneToOne(() => UserProfile, {cascade: true, onDelete: 'CASCADE'})
    // @JoinColumn({name: 'profileId'})
    // profile: UserProfile;

    @AutoMap()
    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;

    @AutoMap()
    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date;

    constructor(user: Partial<UserIdentity>) {
        Object.assign(this, user);
    }
}

