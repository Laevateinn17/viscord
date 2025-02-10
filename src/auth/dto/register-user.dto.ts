
import { AutoMap } from "@automapper/classes";
import { Transform } from "class-transformer";
import { RegisterError } from "../errors/register-error";

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
    @Transform(({ value }) => new Date(value))
    dateOfBirth: Date;

    validate(): (RegisterError | undefined) {
        const error: RegisterError = {};
        if (!this.email || this.email.length === 0) {
            error.email = 'Email must be filled.'
            return error;
        }
        if (!this.displayName || this.displayName.length === 0) {
            error.displayName = 'Display name must be filled.'
            return error;
        }
        if (!this.username || this.username.length === 0) {
            error.username =  'Username must be filled.';
            return error;
        }
        if (!this.password || this.password.length === 0) {
            error.password = 'Password must be filled.';
            return error;
        }
        if (!this.dateOfBirth) {
            error.dateOfBirth = 'Date of Birth must be filled.';
            return error;
        }

        if (!this.email.match(
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )) {
            error.email = 'Email is not valid.';
            return error;
        }

        if (this.username.split(' ').length > 1) {
            error.username = 'Username must not contain any spaces.';
            return error;
        }

        if (this.username.match(/[^A-Za-z0-9_.]/)) {
            error.username = 'Invalid username.';
            return error;
        }

        if (this.password.length < this.MIN_PASSWORD_LENGTH) {
            error.password = `Password mmust be ${this.MIN_PASSWORD_LENGTH} or more characters.`;
            return error;
        }

        if (new Date().getFullYear() - new Date(this.dateOfBirth).getFullYear() < this.MIN_AGE_REQUIREMENT) {
            error.dateOfBirth = `You must be ${this.MIN_AGE_REQUIREMENT} years or older to register`;
            return error;
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