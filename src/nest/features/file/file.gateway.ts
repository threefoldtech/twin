import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UPLOADED_FILE_ACTION } from 'types/file-actions.type';

@WebSocketGateway({ cors: '*' })
export class FileGateway implements OnGatewayInit {
    @WebSocketServer()
    private server: Server;

    private logger: Logger = new Logger('FileGateway');

    constructor(private readonly _configService: ConfigService) {}

    afterInit(server: Server) {
        this.logger.log(`chat gateway setup successful`);
        this.server = server;
    }

    @SubscribeMessage('handle_uploaded_file')
    async handleUploadedFile(@MessageBody() { fileId, action }: { fileId: string; action: UPLOADED_FILE_ACTION }) {
        console.log(`FILE ID: ${fileId}`);
        console.log(`ACTION: ${action}`);
        console.log(`BASE DIR: ${this._configService.get<string>('baseDir')}`);
        return true;
    }
}
