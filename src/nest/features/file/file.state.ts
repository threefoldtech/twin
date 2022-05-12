import { ConfigService } from '@nestjs/config';
import { ChatFile } from 'types/file-actions.type';

import { FileService } from './file.service';

export enum FileAction {
    ADD_TO_CHAT = 'ADD_TO_CHAT',
    CHANGE_AVATAR = 'CHANGE_AVATAR',
}

export abstract class FileState<T> {
    abstract handle({ fileId, payload, action }: { fileId: string; payload: T; action: FileAction }): Promise<boolean>;
}

export class ChatFileState implements FileState<ChatFile> {
    private chatDir = '';

    constructor(private readonly _configService: ConfigService, private readonly _fileService: FileService) {
        this.chatDir = `${this._configService.get<string>('baseDir')}chats`;
    }

    async handle({
        fileId,
        payload,
        action,
    }: {
        fileId: string;
        payload: ChatFile;
        action: FileAction;
    }): Promise<boolean> {
        console.log(`FILE ID: ${fileId}`);
        console.log(`PAYLOAD: ${JSON.stringify(payload)}`);
        console.log(`ACTION: ${action}`);
        console.log(`CHAT DIR: ${this.chatDir}`);

        const { chatId, messageId } = payload;
        const from = `tmp/${fileId}`;
        const to = `${this.chatDir}/${chatId}/${messageId}`;
        // TODO: WIP
        // move file from tmp/:fileId to /appdata/chats/:chatId/files/:messageId
        try {
            this._fileService.moveFile({ from, to });
            console.log(`FILE MOVED`);
        } catch (error) {
            console.error(error);
            return false;
        }
        // create new message and emit to connected sockets
        // append signature to message
        // send message to api
        // append message to chat
        return true;
    }
}
