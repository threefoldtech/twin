import { Entity, Schema } from 'redis-om';

export class Key extends Entity {}

export const keySchema = new Schema(
    Key,
    {
        userId: { type: 'string' },
        key: { type: 'string' },
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
