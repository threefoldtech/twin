import { BadRequestException, Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { Chat, chatSchema } from '../models/chat.model';

@Injectable()
export class ChatService {
    private _chatRepo: Repository<Chat>;

    constructor(private readonly _dbService: DbService) {
        this._chatRepo = this._dbService.createRepository(chatSchema);
    }

    /**
     * Creates a new chat.
     * All entities like: contacts, messages are models but need to be parsed as strings for Redis.
     * @param {string} name - The name of the new chat.
     * @param {string[]} contacts - List of chat contacts.
     * @param {string[]} messages - List of chat messages.
     * @param {string} adminId - Admin ID of the chat.
     * @param {string[]} read - Group of user IDs that have read the last messages in chat.
     * @param {boolean} isGroup - Group chat or not.
     * @param {string[]} draft - List of draft messages.
     * @return {Chat} - Created entity.
     */
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
