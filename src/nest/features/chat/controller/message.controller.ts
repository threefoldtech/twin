import { BadRequestException, Body, Controller, ForbiddenException, Put, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ContactDTO } from '../dtos/contact.dto';
import { MessageDTO } from '../dtos/message.dto';
import { Message } from '../models/message.model';
import { BlockedContactService } from '../service/blocked-contact.service';
import { ChatService } from '../service/chat.service';
import { ContactService } from '../service/contact.service';
import { MessageService } from '../service/message.service';
import { ContactRequestMessageState, MessageState } from '../state/message.state';
import { GroupUpdate, MessageType, SystemMessageType } from '../types/message.type';

@Controller('messages')
export class MessageController {
    private messageStateHandlersMap = new Map<MessageType, MessageState>();

    constructor(
        private readonly _configService: ConfigService,
        private readonly _messageService: MessageService,
        private readonly _chatService: ChatService,
        private readonly _contactService: ContactService,
        private readonly _blockedContactService: BlockedContactService
    ) {
        this.messageStateHandlersMap.set(MessageType.CONTACT_REQUEST, new ContactRequestMessageState());
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

        return this.messageStateHandlersMap.get(message.type).handle(message);

        // const isContactRequest = message.type === MessageType.CONTACT_REQUEST;
        // if (isContactRequest) {
        // const from = (<unknown>message.body) as ContactDTO;
        // const validSignature = await this._messageService.verifySignedMessage({
        //     isGroup: false,
        //     adminContact: null,
        //     fromContact: from,
        //     signedMessage: message,
        // });
        // if (!validSignature) throw new BadRequestException(`failed to verify message signature`);
        // return await this._contactService.createNewContactRequest({
        //     id: from.id,
        //     location: from.location,
        //     message: (<unknown>message) as Message,
        // });
        // }

        // const chatID = this._messageService.determineChatID(message);
        // const chat = await this._chatService.getChat(chatID);

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
