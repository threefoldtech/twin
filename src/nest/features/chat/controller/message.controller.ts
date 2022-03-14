import { Body, Controller, ForbiddenException, Put, Query } from '@nestjs/common';

import { CreateMessageDTO } from '../dtos/message.dto';
import { MessageType } from '../models/message.model';
import { BlockedContactService } from '../service/blocked-contact.service';

@Controller('messages')
export class MessageController {
    constructor(private readonly _blockedContactService: BlockedContactService) {}

    @Put()
    async handleIncomingMessage<T>(
        @Body() message: CreateMessageDTO<T>,
        @Query('offset') offset = 0,
        @Query('count') count = 25
    ) {
        const blockedContacts = await this._blockedContactService.getBlockedContactList({ offset, count });

        const isBlocked = blockedContacts.find(c => c.id === message.from);
        if (isBlocked) throw new ForbiddenException('blocked');

        const isContactRequest = message.type === MessageType.CONTACT_REQUEST;
        if (isContactRequest) {
            // todo
        }
    }
}
