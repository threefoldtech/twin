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
        if (draft && this.draft.length) return this.draft.map(msg => JSON.parse(msg));

        return this.messages.map(msg => JSON.parse(msg));
    }

    /**
     * Parses contact strings to valid JSON.
     * @return {Contact[]} - The parsed contacts.
     */
    parseContacts(): Contact[] {
        return this.contacts.map(contact => JSON.parse(contact));
    }
}

export function stringifyMessages(messages: Message[]): string[] {
    return messages.map(msg => JSON.stringify(msg));
}

export function stringifyContacts(contacts: Contact[]): string[] {
    return contacts.map(contact => JSON.stringify(contact));
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
