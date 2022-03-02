import { Entity, Schema } from 'redis-om';

import { Contact } from './contact.model';
import { Message } from './message.model';

export interface Chat {
    name: string;
    contacts: Contact[];
    messages: Message[];
    acceptedChat: boolean;
    adminId: string;
    read: string[];
    isGroup: boolean;
    draft?: Message;
}

export class Chat extends Entity {}

export const chatSchema = new Schema(Chat, {
    name: { type: 'string' },
    contacts: { type: 'string[]' },
    messages: { type: 'string[]' },
    acceptedChat: { type: 'boolean' },
    adminId: { type: 'string' },
    read: { type: 'string[]' },
    isGroup: { type: 'boolean' },
    draft: { type: 'string[]' },
});
