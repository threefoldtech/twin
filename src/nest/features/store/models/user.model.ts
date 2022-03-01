import { Entity, Schema } from 'redis-om';

export interface User {
    userId: string;
    status: string;
    avatar: string;
    lastSeen: string;
}

export class User extends Entity {}

export const userSchema = new Schema(User, {
    userId: { type: 'string' },
    status: { type: 'string' },
    avatar: { type: 'string' },
    lastSeen: { type: 'string' },
});
