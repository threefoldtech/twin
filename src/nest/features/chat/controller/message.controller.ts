import { BadRequestException, Body, Controller, ForbiddenException, Put, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ContactDTO } from '../dtos/contact.dto';
import { MessageDTO } from '../dtos/message.dto';
import { Message } from '../models/message.model';
import { BlockedContactService } from '../service/blocked-contact.service';
import { ChatService } from '../service/chat.service';
import { ContactService } from '../service/contact.service';
import { MessageService } from '../service/message.service';
import { ContactRequestMessageState, MessageState, SystemMessageState } from '../state/message.state';
import { GroupUpdate, MessageType, SystemMessageType } from '../types/message.type';

@Controller('messages')
export class MessageController {
    private messageStateHandlers = new Map<MessageType, MessageState<unknown>>();

    constructor(
        private readonly _configService: ConfigService,
        private readonly _messageService: MessageService,
        private readonly _chatService: ChatService,
        private readonly _contactService: ContactService,
        private readonly _blockedContactService: BlockedContactService
    ) {
        // init message handlers
        this.messageStateHandlers.set(
            MessageType.CONTACT_REQUEST,
            new ContactRequestMessageState(this._messageService, this._contactService)
        );
        this.messageStateHandlers.set(
            MessageType.SYSTEM,
            new SystemMessageState(this._messageService, this._chatService, this._configService)
        );
    }

    @Put()
    async handleIncomingMessage<T>(
        @Body() message: MessageDTO<T>,
        @Query('offset') offset = 0,
        @Query('count') count = 25
    ) {
        const blockedContacts = await this._blockedContactService.getBlockedContactList({ offset, count });
        const isBlocked = blockedContacts.find(c => c.id === message.from);
        if (isBlocked) throw new ForbiddenException('blocked');

        const chatId = this._messageService.determineChatID(message);
        const chat = await this._chatService.getChat(chatId);
        const userId = this._configService.get<string>('userId');

        if (chat.isGroup && chat.adminId === userId) await this._chatService.handleGroupAdmin({ chat, message });

        // get correct message handler and let it handle the incoming message
        return await this.messageStateHandlers.get(message.type).handle({ message, chat });

        // const validSignature = await this._messageService.verifySignedMessageByChat({ chat, signedMessage: message });
        // if (!validSignature) throw new BadRequestException(`failed to verify message signature`);

        // const userId = this._configService.get<string>('userId');
        // const isSystemMessage = message.type === MessageType.SYSTEM;
        // if (isSystemMessage) {
        //     const { type, contact } = (<unknown>message.body) as GroupUpdate;
        //     const isAddUserType = type === SystemMessageType.ADDUSER;
        //     if (isAddUserType && userId === contact.id) {
        //         // TODO: add to group
        //     }
        // }

        // if (chat.isGroup && chat.adminId === userId) {
        //     // TODO: handle group admin
        // }
    }
}
