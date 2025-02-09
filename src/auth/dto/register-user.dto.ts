
import { AutoMap } from "@automapper/classes";
import { Transform } from "class-transformer";

export class RegisterUserDTO {
    @AutoMap()
    email: string;
    @AutoMap()
    displayName: string;
    @AutoMap()
    username: string;
    @AutoMap()
    password: string;

    @AutoMap()
    @Transform(({value}) => new Date(value))
    dateOfBirth: Date;

    validate(): (string | undefined) {
        if (!this.email || this.email.length === 0) {
            return 'Email must be filled.';
        }
        if (!this.displayName || this.displayName.length === 0) {
            return 'Display name must be filled.';
        }
        if (!this.username || this.username.length === 0) {
            return 'Username must be filled.';
        }
        if (!this.password || this.password.length === 0) {
            return 'Password must be filled.';
        }
        if (!this.dateOfBirth) {
            return 'Date of Birth must be filled.';
        }

        if (!this.email.match(
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )) {
            return 'Email is not valid.';
        }

        if (this.username.split(' ').length > 1) {
            return 'Username must not contain any spaces.';
        }

        if (this.username.match(/[^A-Za-z0-9_.]/)) {
            return 'Invalid username.';
        }

        if (this.password.length < this.MIN_PASSWORD_LENGTH) {
            return `Password mmust be ${this.MIN_PASSWORD_LENGTH} or more characters.`;
        }

        if (new Date().getFullYear() - new Date(this.dateOfBirth).getFullYear() < this.MIN_AGE_REQUIREMENT) {
            return `You must be ${this.MIN_AGE_REQUIREMENT} years or older to register`;
        }
    }

    trim() {
        this.email.trim();
        this.displayName.trim();
        this.username.trim();
    }

    private readonly MIN_AGE_REQUIREMENT = 13
    private readonly MIN_PASSWORD_LENGTH = 8
}