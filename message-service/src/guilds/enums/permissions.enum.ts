

export const Permissions = {
    VIEW_CHANNELS: 1n << 0n,
    MANAGE_CHANNELS: 1n << 1n,
    MANAGE_ROLES: 1n << 2n,
    MANAGE_SERVERS: 1n << 3n,
    CREATE_INVITES: 1n << 4n,
    SEND_MESSAGES: 1n << 5n,
    ATTACH_FILES: 1n << 6n,
    MENTION_ROLES: 1n << 7n,
    MANAGE_MESSAGES: 1n << 8n,
    PIN_MESSAGES: 1n << 9n,
}

export const ALL_PERMISSIONS = Object.values(Permissions)
  .reduce((acc, perm) => acc | perm, 0n);