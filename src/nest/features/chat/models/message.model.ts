import { Entity, Schema } from 'redis-om';

export interface Message {
    chatId: string;
    from: string;
    to: string;
    body: string;
    timestamp: Date;
    type: MessageType;
    subject: string;
    signatures: string[];
    replies: Message[];
}

export class Message extends Entity {}

export function stringifyMessage(message: Message): string {
    return JSON.stringify(message);
}

export const messageSchema = new Schema(Message, {
    chatId: { type: 'string' },
    from: { type: 'string' },
    to: { type: 'string' },
    body: { type: 'text' },
    timestamp: { type: 'date' },
    type: { type: 'string' },
    subject: { type: 'string' },
    signatures: { type: 'string[]' },
    replies: { type: 'string[]' },
});

export enum MessageType {
    STRING,
    SYSTEM,
    GIF,
    MESSAGE,
    FILE,
    FILE_UPLOAD,
    FILE_SHARE,
    FILE_SHARE_UPDATE,
    FILE_SHARE_REQUEST,
    FILE_SHARE_INTENT,
    EDIT,
    READ,
    CONTACT_REQUEST,
    DELETE,
    GROUP_UPDATE,
    QUOTE,
    DOWNLOAD_ATTACHMENT,
}
