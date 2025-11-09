
export enum AccountStatus {
    Active = 0,
    Disabled = 1,
    Banned = 2,
}

export const AccountStatusString = {
    [AccountStatus.Active]: "Active",
    [AccountStatus.Disabled]: "Disabled",
    [AccountStatus.Banned]: "Banned",
}