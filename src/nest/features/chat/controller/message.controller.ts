import { BadRequestException, Body, Controller, ForbiddenException, Put, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ContactDTO } from '../dtos/contact.dto';
import { MessageDTO } from '../dtos/message.dto';
import { MessageType } from '../models/message.model';
import { BlockedContactService } from '../service/blocked-contact.service';
import { ChatService } from '../service/chat.service';
import { ContactService } from '../service/contact.service';
import { MessageService } from '../service/message.service';

@Controller('messages')
export class MessageController {
    constructor(
        private readonly _configService: ConfigService,
        private readonly _messageService: MessageService,
        private readonly _chatService: ChatService,
        private readonly _contactService: ContactService,
        private readonly _blockedContactService: BlockedContactService
    ) {}

    @Put()
    async handleIncomingMessage<T>(
        @Body() message: MessageDTO<T>,
        @Query('offset') offset = 0,
        @Query('count') count = 25
    ) {
        const blockedContacts = await this._blockedContactService.getBlockedContactList({ offset, count });

        const isBlocked = blockedContacts.find(c => c.id === message.from);
        if (isBlocked) throw new ForbiddenException('blocked');

        const isContactRequest = message.type === MessageType.CONTACT_REQUEST;
        if (isContactRequest) {
            const from = (<unknown>message.body) as ContactDTO;
            const validSignature = await this._messageService.verifySignedMessage({
                isGroup: false,
                adminContact: null,
                fromContact: from,
                signedMessage: message,
            });
            if (!validSignature) throw new BadRequestException(`failed to verify message signature`);
            return await this._contactService.createNewContact({ id: from.id, location: from.location });
        }

        const chatID = this._messageService.determineChatID(message);
        const chat = await this._chatService.getChat(chatID);

        const validSignature = await this._messageService.verifySignedMessageByChat({ chat, signedMessage: message });
        if (!validSignature) throw new BadRequestException(`failed to verify message signature`);

        // TODO
    }
}
