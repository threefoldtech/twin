import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiService } from '../../api/api.service';
import { ChatGateway } from '../../chat/chat.gateway';
import { ChatService } from '../../chat/chat.service';
import { Chat } from '../../chat/models/chat.model';
import { ContactService } from '../../contact/contact.service';
import { CreateContactDTO } from '../../contact/dtos/contact.dto';
import { CreateMessageDTO, MessageDTO } from '../dtos/message.dto';
import { MessageService } from '../message.service';
import { ContactRequest, GroupUpdate, SystemMessage, SystemMessageType } from '../types/message.type';
import {
    AddUserSystemState,
    PersistSystemMessage,
    RemoveUserSystemState,
    SubSystemMessageState,
} from './system-message.state';

export abstract class MessageState<T> {
    abstract handle({ message, chat }: { message: MessageDTO<T>; chat: Chat }): Promise<unknown>;
}

export class ContactRequestMessageState implements MessageState<ContactRequest> {
    constructor(private readonly _messageService: MessageService, private readonly _contactService: ContactService) {}

    async handle({
        message,
    }: {
        message: MessageDTO<ContactRequest>;
        chat: Chat;
    }): Promise<CreateContactDTO<ContactRequest>> {
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
            message: (<unknown>message) as CreateMessageDTO<ContactRequest>,
            contactRequest: true,
        });
    }
}

export class ReadMessageState implements MessageState<string> {
    constructor(private readonly _chatService: ChatService, private readonly _chatGateway: ChatGateway) {}

    async handle({ message }: { message: MessageDTO<string>; chat: Chat }): Promise<string> {
        this._chatGateway.emitMessageToConnectedClients('message', message);
        return await this._chatService.handleMessageRead(message);
    }
}

export class SystemMessageState implements MessageState<SystemMessage> {
    private _subSystemMessageStateHandlers = new Map<SystemMessageType, SubSystemMessageState>();

    constructor(
        private readonly _messageService: MessageService,
        private readonly _chatService: ChatService,
        private readonly _configService: ConfigService,
        private readonly _apiService: ApiService,
        private readonly _chatGateway: ChatGateway
    ) {
        // system add user message handler
        this._subSystemMessageStateHandlers.set(
            SystemMessageType.ADD_USER,
            new AddUserSystemState(this._apiService, this._chatService, this._configService, this._chatGateway)
        );
        // system remove user message handler
        this._subSystemMessageStateHandlers.set(
            SystemMessageType.REMOVE_USER,
            new RemoveUserSystemState(this._apiService, this._chatService, this._configService, this._chatGateway)
        );
        // system joined video room message handler
        this._subSystemMessageStateHandlers.set(
            SystemMessageType.JOINED_VIDEOROOM,
            new PersistSystemMessage(this._chatService)
        );
        // system contact request send message handler
        this._subSystemMessageStateHandlers.set(
            SystemMessageType.CONTACT_REQUEST_SEND,
            new PersistSystemMessage(this._chatService)
        );
    }

    async handle({ message, chat }: { message: MessageDTO<SystemMessage>; chat: Chat }) {
        const validSignature = await this._messageService.verifySignedMessageByChat({ chat, signedMessage: message });
        if (!validSignature) throw new BadRequestException(`failed to verify message signature`);

        const { type } = message.body as GroupUpdate;
        await this._subSystemMessageStateHandlers.get(type).handle({ message, chat });

        return await this._chatService.addMessageToChat({ chat, message });
    }
}
