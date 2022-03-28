import { Entity, Schema } from 'redis-om';

import { ContactDTO } from '../../contact/dtos/contact.dto';
import { Contact } from '../../contact/models/contact.model';
import { MessageDTO } from '../../message/dtos/message.dto';
import { Message } from '../../message/models/message.model';

/**
 * Every model with string[] will later be parsed to the correct model type.
 * string[] is needed for Redis.
 */
export interface Chat {
    chatId: string;
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
     * @param draft - Parse drafts of messages if false. Defaults to false.
     * @return {Message[]} - The parsed messages.
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

/**
 * Stringifies messages JSON to a string for Redis.
 * @return {string[]} - The stringified messages.
 */
export function stringifyMessages<T>(messages: MessageDTO<T>[]): string[] {
    return messages.map(msg => JSON.stringify(msg));
}

/**
 * Stringifies contacts JSON to a string for Redis.
 * @return {string[]} - The stringified contacts.
 */
export function stringifyContacts(contacts: ContactDTO[]): string[] {
    return contacts.map(contact => JSON.stringify(contact));
}

export const chatSchema = new Schema(Chat, {
    chatId: { type: 'string' },
    name: { type: 'string' },
    contacts: { type: 'string[]' },
    messages: { type: 'string[]' },
    acceptedChat: { type: 'boolean' },
    adminId: { type: 'string' },
    read: { type: 'string[]' },
    isGroup: { type: 'boolean' },
    draft: { type: 'string[]' },
});
