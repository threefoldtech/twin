import { Entity, Schema } from 'redis-om';

export class Key extends Entity {}

export const keySchema = new Schema(
    Key,
    {
        userId: { type: 'string', textSearch: true },
        key: { type: 'string', textSearch: true },
        keyType: { type: 'string' },
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
