import { Entity, Schema } from 'redis-om';

export class Connection extends Entity {}

export const connectionSchema = new Schema(Connection, {
    connection: { type: 'string' },
});
