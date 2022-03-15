import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiService } from '../../api/service/api.service';
import { CreateContactDTO } from '../dtos/contact.dto';
import { MessageDTO } from '../dtos/message.dto';
import { ChatGateway } from '../gateway/chat.gateway';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { ChatService } from '../service/chat.service';
import { ContactService } from '../service/contact.service';
import { MessageService } from '../service/message.service';
import { ContactRequest, GroupUpdate, SystemMessage, SystemMessageType } from '../types/message.type';
import { AddUserSystemState, RemoveUserSystemState, SubSystemMessageState } from './system-message.state';

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
    private _systemMessageStateHandlers = new Map<SystemMessageType, SubSystemMessageState>();

    constructor(
        private readonly _messageService: MessageService,
        private readonly _chatService: ChatService,
        private readonly _configService: ConfigService,
        private readonly _apiService: ApiService,
        private readonly _chatGateway: ChatGateway
    ) {
        // init sub system message state handlers
        this._systemMessageStateHandlers.set(
            SystemMessageType.ADD_USER,
            new AddUserSystemState(this._apiService, this._chatService, this._configService, this._chatGateway)
        );
        this._systemMessageStateHandlers.set(
            SystemMessageType.REMOVE_USER,
            new RemoveUserSystemState(this._apiService, this._chatService, this._configService, this._chatGateway)
        );
    }

    async handle({ message, chat }: { message: MessageDTO<SystemMessage>; chat: Chat }) {
        const validSignature = await this._messageService.verifySignedMessageByChat({ chat, signedMessage: message });
        if (!validSignature) throw new BadRequestException(`failed to verify message signature`);

        const { type } = message.body as GroupUpdate;
        await this._systemMessageStateHandlers.get(type).handle({ message, chat });

        return await this._chatService.addMessageToChat({ chat, message });
    }
}

// export class AddUserMessageState implements MessageState {
//     handle(): Promise<unknown> {
//         throw new Error('Method not implemented.');
//     }
// }
