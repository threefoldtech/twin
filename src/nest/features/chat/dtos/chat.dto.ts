import { IsArray, IsBoolean, IsString } from 'class-validator';

import { Message } from '../models/message.model';
import { ContactDTO } from './contact.dto';
import { MessageDTO } from './message.dto';

export class ChatDTO {
    chatId: string;
    contacts: ContactDTO[];
    isGroup: boolean;
    messages: MessageDTO<unknown>[];
    name: string;
    acceptedChat: boolean;
    adminId: string;
    read: string[];
    draft?: Message[];
}

export class CreateChatDTO {
    @IsString()
    chatId: string;

    @IsString()
    name: string;

    @IsArray()
    contacts: ContactDTO[];

    @IsArray()
    messages: MessageDTO<unknown>[];

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
