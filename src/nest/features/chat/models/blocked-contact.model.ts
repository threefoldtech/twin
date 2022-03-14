import { Entity, Schema } from 'redis-om';

export interface BlockedContact {
    id: string;
    location: string;
    since: Date;
}

export class BlockedContact extends Entity {}

export const blockedContactSchema = new Schema(BlockedContact, {
    id: { type: 'string' },
    location: { type: 'string' },
    since: { type: 'date' },
});
