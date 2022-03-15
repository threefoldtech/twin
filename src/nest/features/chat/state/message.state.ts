import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CreateContactDTO } from '../dtos/contact.dto';
import { MessageDTO } from '../dtos/message.dto';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { ChatService } from '../service/chat.service';
import { ContactService } from '../service/contact.service';
import { MessageService } from '../service/message.service';
import { ContactRequest, GroupUpdate, SystemMessage, SystemMessageType } from '../types/message.type';

export abstract class MessageState<T> {
    abstract handle({ message, chat }: { message: MessageDTO<T>; chat: Chat }): Promise<unknown>;
}

export class ContactRequestMessageState implements MessageState<ContactRequest> {
    constructor(private readonly _messageService: MessageService, private readonly _contactService: ContactService) {}

    async handle({ message }: { message: MessageDTO<ContactRequest>; chat: Chat }): Promise<CreateContactDTO> {
        const from = message.body;
        const validSignature = await this._messageService.verifySignedMessage({
            isGroup: false,
            adminContact: null,
            fromContact: from,
            signedMessage: message,
        });
        if (!validSignature) throw new BadRequestException(`failed to verify message signature`);
        return await this._contactService.createNewContactRequest({
            id: from.id,
            location: from.location,
            message: (<unknown>message) as Message,
        });
    }
}

export class SystemMessageState implements MessageState<SystemMessage> {
    constructor(
        private readonly _messageService: MessageService,
        private readonly _chatService: ChatService,
        private readonly _configService: ConfigService
    ) {}

    async handle({ message, chat }: { message: MessageDTO<SystemMessage>; chat: Chat }) {
        const validSignature = await this._messageService.verifySignedMessageByChat({ chat, signedMessage: message });
        if (!validSignature) throw new BadRequestException(`failed to verify message signature`);
        const userId = this._configService.get<string>('userId');
        const { type, contact, adminLocation } = message.body as GroupUpdate;
        const isAddUserType = type === SystemMessageType.ADD_USER;
        if (isAddUserType && userId === contact.id)
            return this.handleAddUserToGroup({ adminLocation, chatID: message.to });
    }

    private async handleAddUserToGroup({
        adminLocation,
        chatID,
    }: {
        adminLocation: string;
        chatID: string;
    }): Promise<Chat> {
        return await this._chatService.syncNewChatWithAdmin({ adminLocation, chatID });
    }
}

// export class AddUserMessageState implements MessageState {
//     handle(): Promise<unknown> {
//         throw new Error('Method not implemented.');
//     }
// }
