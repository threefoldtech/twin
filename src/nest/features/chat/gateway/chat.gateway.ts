import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ConnectionService } from '../../connection/service/connection.service';
import { KeyService } from '../../key/service/key.service';
import { SocketService } from '../../socket/service/socket.service';
import { Message } from '../models/message.model';
import { ChatService } from '../service/chat.service';

@WebSocketGateway({ cors: '*', namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private logger: Logger = new Logger('ChatGateway');
    private connectionID = '';

    constructor(
        private readonly _socketService: SocketService,
        private readonly _configService: ConfigService,
        private readonly _connectionService: ConnectionService,
        private readonly _keyService: KeyService,
        private readonly _chatService: ChatService
    ) {}

    /**
     * TODO: WIP
     * Sends a new incoming message to all connected clients.
     * create chat if first message
     */
    @SubscribeMessage('message_to_server')
    async handleIncomingMessage(@MessageBody() message: Message) {
        console.log(message);
        // correct from to message
        message.from = this._configService.get<string>('userId');

        // sign message
        const signedMessage = await this._keyService.appendSignatureToMessage(message);

        // emit message to connected users
        this._socketService.server.emit('message_to_client', signedMessage);

        // get chat data
        const chat = await this._chatService.getChat(message.chatId);
        // set accepted to true
        chat.acceptedChat = true;
        // update chat messages
        this._chatService.addMessageToChat({ chat, message: signedMessage });

        // const location = chat.contacts.find(c => c == chat.adminId);

        // if (signedMessage.type === MessageType.READ) {
        //     // TODO: handle read
        // }
    }

    /**
     * Adds a user to a chat for socket io.
     * @param {string} chatId - The chat ID to join.
     */
    @SubscribeMessage('join_chat')
    handleJoinChat(client: Socket, chatId: string): void {
        client.join(chatId);
        client.emit('joined_chat', chatId);
    }

    /**
     * Removes a user from a chat for socket io.
     * @param {string} chatId - The chat ID to join.
     */
    @SubscribeMessage('leave_chat')
    handleLeaveChat(client: Socket, chatId: string): void {
        client.leave(chatId);
        client.emit('left_chat', chatId);
    }

    /**
     * Handles socket initialization.
     * @param {Server} server - socket.io server.
     */
    afterInit(server: Server) {
        this._socketService.server = server;
    }

    /**
     * Handles a new socket.io client connection.
     * @param {Socket} client - socket.io client.
     */
    async handleConnection(client: Socket): Promise<void> {
        this.logger.log(`new client connection: ${client.id}`);
        const newConnection = await this._connectionService.addConnection(client.id);
        this.connectionID = newConnection.entityId;
    }

    /**
     * Handles a socket.io client disconnection.
     * @param {Socket} client - socket.io client.
     */
    async handleDisconnect(client: Socket): Promise<void> {
        this.logger.log(`client disconnected: ${client.id}`);
        await this._connectionService.removeConnection(this.connectionID);
    }
}
