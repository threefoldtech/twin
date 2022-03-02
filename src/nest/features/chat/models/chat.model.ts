import { Entity, Schema } from 'redis-om';

import { Message } from './message.model';

export interface Chat {
    name: string;
    contacts: string[];
    messages: string[];
    acceptedChat: boolean;
    adminId: string;
    read: string[];
    isGroup: boolean;
    draft?: string;
}

export class Chat extends Entity {
    parseMessages() {
        const parsedMessages: Message[] = [];
        this.messages.forEach(msg => {
            console.log(msg);
            parsedMessages.push(JSON.parse(msg));
        });
        return parsedMessages;
    }
}

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
