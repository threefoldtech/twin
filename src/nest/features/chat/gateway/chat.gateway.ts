import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ConnectionService } from '../../connection/service/connection.service';
import { CreateMessageDTO } from '../dtos/message.dto';

@WebSocketGateway({ cors: '*', namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('ChatGateway');
    private connectionID = '';
    private connections: string[] = [];

    constructor(
        private readonly _configService: ConfigService,
        private readonly _connectionService: ConnectionService
    ) {}

    /**
     * TODO: WIP
     * Sends a new incoming message to all connection clients.
     */
    @SubscribeMessage('message')
    handleIncomingMessage(@MessageBody() message: CreateMessageDTO): void {
        message.from = this._configService.get<string>('userId');
        console.log(message);

        this.server.to(message.chatId).emit('message', message);

        // update chat
    }

    /**
     * Handles a new socket.io client connection.
     * @param {Socket} client - socket.io client.
     */
    async handleConnection(client: Socket) {
        this.logger.log(`new client connection: ${client.id}`);
        const newConnection = await this._connectionService.addConnection(client.id);
        this.connectionID = newConnection.entityId;
        this.connections.push(newConnection.connection);
    }

    /**
     * Handles a socket.io client disconnection.
     * @param {Socket} client - socket.io client.
     */
    async handleDisconnect(client: Socket) {
        this.logger.log(`client disconnected: ${client.id}`);
        await this._connectionService.removeConnection(this.connectionID);
    }
}
