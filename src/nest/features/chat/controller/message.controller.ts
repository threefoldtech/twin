import { Body, Controller, ForbiddenException, Put, Query } from '@nestjs/common';

import { ContactDTO } from '../dtos/contact.dto';
import { MessageDTO } from '../dtos/message.dto';
import { MessageType } from '../models/message.model';
import { BlockedContactService } from '../service/blocked-contact.service';
import { MessageService } from '../service/message.service';

@Controller('messages')
export class MessageController {
    constructor(
        private readonly _blockedContactService: BlockedContactService,
        private readonly _messageService: MessageService
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
        const from = (<unknown>message.body) as ContactDTO;
        const validSignature = await this._messageService.verifySignedMessage({
            isGroup: false,
            adminContact: null,
            fromContact: from,
            signedMessage: message,
        });

        if (isContactRequest && validSignature) {
            // TODO: handle contact request
        }
    }
}
