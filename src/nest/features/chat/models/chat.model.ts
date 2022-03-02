import { Contact } from './contact.model';
import { Message } from './message.model';

export interface Chat {
    name: string;
    contacts: Contact[];
    messages: Message<string>[];
    acceptedChat: boolean;
    adminId: string;
    read: { [key: string]: string };
    isGroup: boolean;
    draft?: Message<string>;
}
