import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'redis-om';

import { ApiService } from '../../api/service/api.service';
import { DbService } from '../../db/service/db.service';
import { KeyService } from '../../key/service/key.service';
import { CreateChatDTO } from '../dtos/chat.dto';
import { MessageDTO } from '../dtos/message.dto';
import { ChatGateway } from '../gateway/chat.gateway';
import { Chat, chatSchema, stringifyContacts, stringifyMessages } from '../models/chat.model';
import { Message, stringifyMessage } from '../models/message.model';
import { MessageService } from './message.service';

@Injectable()
export class ChatService {
    private _chatRepo: Repository<Chat>;

    constructor(
        private readonly _configService: ConfigService,
        private readonly _dbService: DbService,
        private readonly _apiService: ApiService,
        private readonly _messageService: MessageService,
        private readonly _keyService: KeyService,
        private readonly _chatGateway: ChatGateway
    ) {
        this._chatRepo = this._dbService.createRepository(chatSchema);
    }

    /**
     * Creates a new chat.
     * @param {string} name - The name of the new chat.
     * @param {Contact[]} contacts - List of chat contacts.
     * @param {Message[]} messages - List of chat messages.
     * @param {string} adminId - Admin ID of the chat.
     * @param {string[]} read - Group of user IDs that have read the last messages in chat.
     * @param {boolean} isGroup - Group chat or not.
     * @param {Message[]} draft - List of draft messages.
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
    }: CreateChatDTO): Promise<Chat> {
        try {
            return await this._chatRepo.createAndSave({
                chatId,
                name,
                contacts: stringifyContacts(contacts),
                messages: stringifyMessages(messages),
                acceptedChat,
                adminId,
                read,
                isGroup,
                draft: stringifyMessages(draft),
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
            throw new ForbiddenException(`not in contact`);
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

    /**
     * @param {string} adminLocation - External admin location to get chat from.
     * @param {string} chatID - Chat ID to fetch from location.
     */
    async syncNewChatWithAdmin({ adminLocation, chatID }: { adminLocation: string; chatID: string }): Promise<Chat> {
        const chat = await this._apiService.getAdminChat({ location: adminLocation, chatID });
        this._chatGateway.emitMessageToConnectedClients('new_chat', chat);
        return await this.createChat(chat);
    }

    async handleGroupAdmin({ chat, message, chatId }: { chat: Chat; message: MessageDTO<unknown>; chatId: string }) {
        const contacts = chat.parseContacts();
        const validSignature = await this._messageService.verifySignedMessage({
            isGroup: false,
            adminContact: null,
            fromContact: contacts.find(c => c.id === message.from),
            signedMessage: message,
        });
        if (!validSignature) throw new BadRequestException(`failed to verify message signature`);

        const signedMessage = await this._keyService.appendSignatureToMessage(message);
        const userId = this._configService.get<string>('userId');
        const receivingContacts = contacts.filter(c => c.id !== userId);
        for (const c of receivingContacts) {
            await this._apiService.sendMessageToApi({ location: c.location, message: signedMessage });
        }
    }
}
