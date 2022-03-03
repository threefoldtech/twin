import { Logger } from '@nestjs/common';
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
import { Message } from '../models/message.model';

@WebSocketGateway({ cors: '*', namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('ChatGateway');
    private connectionID = '';

    constructor(private readonly _connectionService: ConnectionService) {}

    /**
     * TODO: WIP
     */
    @SubscribeMessage('message')
    handleIncomingMessage(@MessageBody() message: Message): void {
        this.server.emit('message', message);
    }

    /**
     * Handles a new socket.io client connection.
     * @param {Socket} client - socket.io client.
     */
    async handleConnection(client: Socket) {
        this.logger.log(`new client connection: ${client.id}`);
        const newConnection = await this._connectionService.addConnection(client.id);
        this.connectionID = newConnection.entityId;
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
