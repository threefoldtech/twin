import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ChatFile } from 'types/file-actions.type';

import { FileMessage, MessageType } from '../../types/message-types';
import { ApiService } from '../api/api.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatService } from '../chat/chat.service';
import { KeyService } from '../key/key.service';
import { LocationService } from '../location/location.service';
import { MessageDTO } from '../message/dtos/message.dto';
import { FileService } from './file.service';

export enum FileAction {
    ADD_TO_CHAT = 'ADD_TO_CHAT',
    CHANGE_AVATAR = 'CHANGE_AVATAR',
}

export abstract class FileState<T> {
    abstract handle({ fileId, payload }: { fileId: string; payload: T }): Promise<boolean>;
}

export class ChatFileState implements FileState<ChatFile> {
    private chatDir = '';

    constructor(
        private readonly _configService: ConfigService,
        private readonly _fileService: FileService,
        private readonly _apiService: ApiService,
        private readonly _locationService: LocationService,
        private readonly _keyService: KeyService,
        private readonly _chatService: ChatService,
        private readonly _chatGateway: ChatGateway
    ) {
        this.chatDir = `${this._configService.get<string>('baseDir')}chats`;
    }

    async handle({ fileId, payload }: { fileId: string; payload: ChatFile }) {
        const { chatId, messageId, type } = payload;
        const fromPath = `tmp/${fileId}`;
        const dirPath = join(this.chatDir, chatId, 'files', messageId);

        try {
            this._fileService.makeDirectory({ path: dirPath });
            this._fileService.moveFile({ from: fromPath, to: join(dirPath, fileId) });
        } catch (error) {
            console.error(error);
            return false;
        }
        // create new message and emit to connected sockets
        const yggdrasilAddress = await this._locationService.getOwnLocation();
        const message: MessageDTO<FileMessage> = {
            id: messageId,
            from: this._configService.get<string>('userId'),
            to: chatId,
            body: {
                type,
                filename: fileId,
                url: `http://[${yggdrasilAddress}]/api/v2/files/chats/${chatId}/${messageId}/${fileId}`,
            },
            timeStamp: new Date(),
            type: MessageType.FILE,
            subject: null,
            signatures: [],
            replies: [],
        };
        this._chatGateway.emitMessageToConnectedClients('message', message);
        const chat = await this._chatService.getChat(chatId);
        const signedMessage = await this._keyService.appendSignatureToMessage({ message });
        const contacts = chat.parseContacts();
        const location = contacts.find(c => c.id === message.to).location;
        this._chatService.addMessageToChat({ chat, message });
        await this._apiService.sendMessageToApi({ location, message: <MessageDTO<string>>signedMessage });
        return true;
    }
}
