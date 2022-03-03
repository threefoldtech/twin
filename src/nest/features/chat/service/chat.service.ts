import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { SocketService } from '../../socket/service/socket.service';
import { Chat, chatSchema } from '../models/chat.model';
import { Message, stringifyMessage } from '../models/message.model';

@Injectable()
export class ChatService {
    private _chatRepo: Repository<Chat>;

    constructor(private readonly _dbService: DbService, private readonly _socketService: SocketService) {
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
            const chat = this._chatRepo.createEntity({
                name,
                contacts,
                messages,
                acceptedChat,
                adminId,
                read,
                isGroup,
                draft,
            });
            const chatId = await this._chatRepo.save(chat);
            // TODO: change chat ID
            this._socketService.server.to(chatId).emit('new_chat', chat);
            return chat;
        } catch (error) {
            console.error(error);
            throw new BadRequestException(`unable to create chat: ${error}`);
        }
    }

    /**
     * Gets accepted chats using pagination.
     * @param offset - Chat offset, defaults to 0.
     * @param count - Amount of chats to fetch, defaults to 25.
     * @return {Chat[]} - Found chats.
     */
    async getAcceptedChats({ offset = 0, count = 25 }: { offset?: number; count?: number } = {}): Promise<Chat[]> {
        try {
            return await this._chatRepo.search().where('acceptedChat').true().return.page(offset, count);
        } catch (error) {
            throw new NotFoundException('no accepted chats found');
        }
    }

    /**
     * Gets a chat by its ID.
     * @param {string} ID - Chat ID.
     * @return {Chat} - Found chat.
     */
    async getChat(ID: string): Promise<Chat> {
        try {
            return await this._chatRepo.fetch(ID);
        } catch (error) {
            throw new NotFoundException('chat not found');
        }
    }

    async addMessageToChat({ chat, message }: { chat: Chat; message: Message }) {
        try {
            chat.messages
                ? chat.messages.push(stringifyMessage(message))
                : (chat.messages = [stringifyMessage(message)]);
            return await this._chatRepo.save(chat);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }
}
