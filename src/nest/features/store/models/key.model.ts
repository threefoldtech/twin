import { Entity, Schema } from 'redis-om';

export class Key extends Entity {}

export const keySchema = new Schema(
    Key,
    {
        userId: { type: 'string', textSearch: true },
        key: { type: 'string' },
        keyType: { type: 'string', textSearch: true },
    },
    {
        dataStructure: 'JSON',
    }
);

export enum KeyType {
    Public,
    Private,
    Secret,
}
