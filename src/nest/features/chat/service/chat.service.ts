import { BadRequestException, Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { Chat, chatSchema } from '../models/chat.model';

@Injectable()
export class ChatService {
    private _chatRepo: Repository<Chat>;

    constructor(private readonly _dbService: DbService) {
        this._chatRepo = this._dbService.createRepository(chatSchema);
    }

    async createChat({
        name,
        contacts,
        messages,
        acceptedChat,
        adminId,
        read,
        isGroup,
        draft,
    }: {
        name: string;
        contacts: string[];
        messages: string[];
        acceptedChat: boolean;
        adminId: string;
        read: string[];
        isGroup: boolean;
        draft: string[];
    }): Promise<Chat> {
        try {
            return await this._chatRepo.createAndSave({
                name,
                contacts,
                messages,
                acceptedChat,
                adminId,
                read,
                isGroup,
                draft,
            });
        } catch (error) {
            console.error(error);
            throw new BadRequestException(`unable to create chat: ${error}`);
        }
    }

    saveMessage(chatId: string, message: string) {
        throw new NotImplementedException();
    }

    async getAcceptedChats(offset = 0, count = 25) {
        try {
            return await this._chatRepo.search().where('acceptedChat').true().return.page(offset, count);
        } catch (error) {
            throw new NotFoundException('no accepted chats found');
        }
    }
}
