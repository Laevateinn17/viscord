
export class LoginDTO {
    identifier: string;
    password: string;

    validate(): string {
        if (!this.identifier || this.identifier.length == 0) {
            return 'Login or password is invalid'
        }

        if (!this.password || this.password.length == 0) {
            return 'Login or password is invalid'
        }
    }
}
