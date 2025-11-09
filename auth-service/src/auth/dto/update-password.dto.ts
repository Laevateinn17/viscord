
export class UpdatePasswordDTO {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;

    validate(): string {
        if (!this.newPassword || this.newPassword.length == 0) {
            return 'Password cannot be empty'
        }

        if (this.newPassword.length < this.MIN_PASSWORD_LENGTH) {
            return `Password mmust be ${this.MIN_PASSWORD_LENGTH} or more characters`
        }

        if (this.newPassword !== this.confirmNewPassword) {
            return 'New password does not match';
        }
    }

    private readonly MIN_PASSWORD_LENGTH = 8
}