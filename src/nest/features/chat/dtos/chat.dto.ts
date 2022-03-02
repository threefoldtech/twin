import { IsArray, IsBoolean, IsString } from 'class-validator';

import { Contact } from '../models/contact.model';
import { Message } from '../models/message.model';

export class CreateChatDTO {
    @IsString()
    name: string;

    @IsArray()
    contacts: Contact[];

    @IsArray()
    messages: Message[];

    @IsBoolean()
    acceptedChat: boolean;

    @IsString()
    adminId: string;

    @IsArray()
    read: string[];

    @IsBoolean()
    isGroup: boolean;

    @IsArray()
    draft?: Message[];
}
