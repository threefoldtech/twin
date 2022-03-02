import { Entity, Schema } from 'redis-om';

import { Contact } from './contact.model';
import { Message } from './message.model';

/**
 * Every model with string[] will later be parsed to the correct model type.
 * string[] is needed for Redis.
 */
export interface Chat {
    name: string;
    contacts: string[];
    messages: string[];
    acceptedChat: boolean;
    adminId: string;
    read: string[];
    isGroup: boolean;
    draft?: string[];
}

export class Chat extends Entity {
    /**
     * Parses message or draft strings to valid JSON.
     * @param {boolean} draft - Parse drafts of messages if false. Defaults to false.
     * @return {Message[]} - The parsed messages.
     *
     */
    parseMessages(draft = false): Message[] {
        const parsedMessages: Message[] = [];
        if (draft && this.draft.length)
            this.draft.forEach(msg => {
                parsedMessages.push(JSON.parse(msg));
            });
        else
            this.messages.forEach(msg => {
                parsedMessages.push(JSON.parse(msg));
            });
        return parsedMessages;
    }

    /**
     * Parses contact strings to valid JSON.
     */
    parseContacts(): Contact[] {
        const parsedContacts: Contact[] = [];
        this.contacts.forEach(contact => {
            parsedContacts.push(JSON.parse(contact));
        });
        return parsedContacts;
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
