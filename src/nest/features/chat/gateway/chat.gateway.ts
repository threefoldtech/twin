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

    constructor(
        private readonly _configService: ConfigService,
        private readonly _connectionService: ConnectionService
    ) {}

    /**
     * TODO: WIP
     * Sends a new incoming message to all connected clients.
     */
    @SubscribeMessage('message')
    handleIncomingMessage(@MessageBody() message: CreateMessageDTO): void {
        message.from = this._configService.get<string>('userId');
        this.server.to(message.chatId).emit('message', message);

        // get chat by id (message.chatId)

        // get location

        // update chat
    }

    /**
     * Adds a user to a chat for socket io.
     * @param {string} chatId - The chat ID to join.
     */
    @SubscribeMessage('join_chat')
    handleJoinChat(client: Socket, chatId: string) {
        client.join(chatId);
        client.emit('joined_chat', chatId);
    }

    /**
     * Removes a user from a chat for socket io.
     * @param {string} chatId - The chat ID to join.
     */
    @SubscribeMessage('leave_chat')
    handleLeaveChat(client: Socket, chatId: string) {
        client.leave(chatId);
        client.emit('left_chat', chatId);
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
