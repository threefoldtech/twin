import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { Chat, chatSchema } from '../models/chat.model';
import { Message, stringifyMessage } from '../models/message.model';

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
        chatId,
        name,
        contacts,
        messages,
        acceptedChat,
        adminId,
        read,
        isGroup,
        draft,
    }: {
        chatId: string;
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
                chatId,
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
            throw new BadRequestException(`unable to create chat: ${error}`);
        }
    }

    /**
     * Gets chats using pagination.
     * @param offset - Chat offset, defaults to 0.
     * @param count - Amount of chats to fetch, defaults to 25.
     * @return {Chat[]} - Found chats.
     */
    async getChats({ offset = 0, count = 25 }: { offset?: number; count?: number } = {}): Promise<Chat[]> {
        try {
            return await this._chatRepo.search().return.page(offset, count);
        } catch (error) {
            throw new NotFoundException('no chats found');
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
     * @param {string} chatID - Chat ID.
     * @return {Chat} - Found chat.
     */
    async getChat(chatID: string): Promise<Chat> {
        try {
            return await this._chatRepo.search().where('chatId').eq(chatID).return.first();
        } catch (error) {
            return null;
        }
    }

    /**
     * Adds a message to a chat.
     * @param {Chat} chat - Chat to add messages to.
     * @param {Message} message - Signed message to add to chat.
     * @return {string} - Chat entity ID.
     */
    async addMessageToChat({ chat, message }: { chat: Chat; message: Message }): Promise<string> {
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
