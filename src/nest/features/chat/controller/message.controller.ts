import { Body, Controller, ForbiddenException, Get, Param, Put, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiService } from '../../api/service/api.service';
import { CreateMessageDTO, MessageDTO } from '../dtos/message.dto';
import { ChatGateway } from '../gateway/chat.gateway';
import { BlockedContactService } from '../service/blocked-contact.service';
import { ChatService } from '../service/chat.service';
import { ContactService } from '../service/contact.service';
import { MessageService } from '../service/message.service';
import { ContactRequestMessageState, MessageState, ReadMessageState, SystemMessageState } from '../state/message.state';
import { MessageType } from '../types/message.type';

@Controller('messages')
export class MessageController {
    private _messageStateHandlers = new Map<MessageType, MessageState<unknown>>();

    constructor(
        private readonly _configService: ConfigService,
        private readonly _messageService: MessageService,
        private readonly _chatService: ChatService,
        private readonly _contactService: ContactService,
        private readonly _blockedContactService: BlockedContactService,
        private readonly _apiService: ApiService,
        private readonly _chatGateway: ChatGateway
    ) {
        // contact request handler
        this._messageStateHandlers.set(
            MessageType.CONTACT_REQUEST,
            new ContactRequestMessageState(this._messageService, this._contactService)
        );
        // read message handler
        this._messageStateHandlers.set(MessageType.READ, new ReadMessageState(this._chatService, this._chatGateway));
        // system message handler
        this._messageStateHandlers.set(
            MessageType.SYSTEM,
            new SystemMessageState(
                this._messageService,
                this._chatService,
                this._configService,
                this._apiService,
                this._chatGateway
            )
        );
    }

    @Put()
    async handleIncomingMessage(
        @Body() message: CreateMessageDTO<unknown>,
        @Query('offset') offset = 0,
        @Query('count') count = 25
    ) {
        console.log(`Message type: ${message.type}`);
        const blockedContacts = await this._blockedContactService.getBlockedContactList({ offset, count });
        const isBlocked = blockedContacts.find(c => c.id === message.from);
        console.log(`isBlocked: ${isBlocked}`);
        if (isBlocked) throw new ForbiddenException('blocked');

        // needs to be checked first otherwise chat will always show as unaccepted
        if (message.type === MessageType.CONTACT_REQUEST)
            return await this._messageStateHandlers.get(MessageType.CONTACT_REQUEST).handle({ message, chat: null });

        // check if chat has been accepted
        const contact = await this._contactService.getAcceptedContact(message.from);
        if (!contact) throw new ForbiddenException(`contact has not yet accepted your chat request`);

        const chatId = this._messageService.determineChatID(message);
        const chat = await this._chatService.getChat(chatId);

        // message needs to be from the chat admin when performing System tasks.
        if (message.type === MessageType.SYSTEM && chat.adminId !== message.from)
            throw new ForbiddenException(`not allowed`);

        const userId = this._configService.get<string>('userId');
        if (chat.isGroup && chat.adminId === userId) await this._chatService.handleGroupAdmin({ chat, message });

        return await this._messageStateHandlers.get(message.type).handle({ message, chat });
    }

    @Get(':chatId')
    async getChatMessages(
        @Param('chatId') chatId: string,
        @Query('from') from: string = null,
        @Query('page') page: number = null,
        @Query('limit') limit = 50
    ): Promise<{ hasMore: boolean; messages: MessageDTO<unknown>[] }> {
        limit = limit > 100 ? 100 : limit;

        return this._chatService.getChatMessages({ chatId, from, page, limit });
    }
}
