import { ConfigService } from '@nestjs/config';

import { ApiService } from '../../api/service/api.service';
import { MessageDTO } from '../dtos/message.dto';
import { ChatGateway } from '../gateway/chat.gateway';
import { Chat } from '../models/chat.model';
import { ChatService } from '../service/chat.service';
import { GroupUpdate, SystemMessage } from '../types/message.type';

export abstract class SubSystemMessageState {
    abstract handle({ message, chat }: { message: MessageDTO<SystemMessage>; chat: Chat }): Promise<unknown>;
}

export class AddUserSystemState implements SubSystemMessageState {
    constructor(
        private readonly _apiService: ApiService,
        private readonly _chatService: ChatService,
        private readonly _configService: ConfigService,
        private readonly _chatGateway: ChatGateway
    ) {}

    async handle({ message, chat }: { message: MessageDTO<SystemMessage>; chat: Chat }): Promise<unknown> {
        const { contact, adminLocation } = message.body as GroupUpdate;
        const userId = this._configService.get<string>('userId');
        if (userId === contact.id)
            return await this._chatService.syncNewChatWithAdmin({ adminLocation, chatID: message.to });

        await this._apiService.sendGroupInvitation({ location: contact.location, chat });
        this._chatGateway.emitMessageToConnectedClients('chat_updated', chat);
        return await this._apiService.sendMessageToApi({ location: contact.location, message });
    }
}

export class RemoveUserSystemState implements SubSystemMessageState {
    constructor(
        private readonly _apiService: ApiService,
        private readonly _chatService: ChatService,
        private readonly _configService: ConfigService,
        private readonly _chatGateway: ChatGateway
    ) {}

    async handle({ message, chat }: { message: MessageDTO<SystemMessage>; chat: Chat }) {
        const userId = this._configService.get<string>('userId');
        const { contact } = message.body as GroupUpdate;
        if (contact.id === userId) {
            const { chatId } = chat;
            await this._chatService.deleteChat(chatId);
            this._chatGateway.emitMessageToConnectedClients('chat_removed', chatId);
        }
        this._chatGateway.emitMessageToConnectedClients('chat_updated', chat);

        await this._chatService.removeContactFromChat({ chat, contactId: contact.id });

        return await this._apiService.sendMessageToApi({ location: contact.location, message });
    }
}
