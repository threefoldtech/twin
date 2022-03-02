import { Entity, Schema } from 'redis-om';

export interface Connection {
    connection: string;
}

export class Connection extends Entity {}

export const connectionSchema = new Schema(Connection, {
    connection: { type: 'string' },
});
