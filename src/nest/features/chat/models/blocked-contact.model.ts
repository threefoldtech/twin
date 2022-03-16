import { Entity, Schema } from 'redis-om';

export interface BlockedContact {
    id: string;
}

export class BlockedContact extends Entity {}

export const blockedContactSchema = new Schema(BlockedContact, {
    id: { type: 'string' },
});
