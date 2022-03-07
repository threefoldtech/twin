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
import { Chat, stringifyContacts } from '../models/chat.model';
import { Contact } from '../models/contact.model';
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
     */
    @SubscribeMessage('message_to_server')
    async handleIncomingMessage(client: Socket, @MessageBody() message: Message) {
        // correct from to message
        message.from = this._configService.get<string>('userId');

        // sign message
        const signedMessage = await this._keyService.appendSignatureToMessage(message);

        // get chat data
        let chat = await this._chatService.getChat(message.chatId);
        if (!chat) {
            chat = await this.createNewChat(signedMessage);
        }

        // set correct chatId to message
        signedMessage.chatId = client.id;

        // notify contacts about creation of new chat
        this._socketService.server.to(client.id).emit('message_to_client', signedMessage);

        const contacts = chat.parseContacts();

        const location = contacts.find(c => c.id == chat.adminId).location;

        // if (signedMessage.type === MessageType.READ) {
        //     // TODO: handle read
        // }

        // persist message
        this._chatService.addMessageToChat({ chat, message: signedMessage });
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
    handleConnection(client: Socket): void {
        this.logger.log(`new client connection: ${client.id}`);
        // const newConnection = await this._connectionService.addConnection(client.id);
        this.handleJoinChat(client, client.id);
        this.connectionID = client.id;
    }

    /**
     * Handles a socket.io client disconnection.
     * @param {Socket} client - socket.io client.
     */
    handleDisconnect(client: Socket): void {
        this.logger.log(`client disconnected: ${client.id}`);
        // await this._connectionService.removeConnection(this.connectionID);
        this.handleLeaveChat(client, client.id);
        this.connectionID = '';
    }

    /**
     * Creates a new chat if chat is not found.
     * @param {string} from - From id.
     * @param {string} to - To id.
     * @return {Chat} - The created chat.
     */
    private async createNewChat({ from, to }: { from: string; to: string }): Promise<Chat> {
        const contacts = [
            {
                id: from,
                location: 'localhost',
            },
            {
                id: to,
                location: 'localhost',
            },
        ];
        return await this._chatService.createChat({
            name: `${from}-${to}`,
            contacts: stringifyContacts(contacts as Contact[]),
            messages: [],
            acceptedChat: false,
            adminId: from,
            read: [],
            isGroup: false,
            draft: [],
        });
    }
}
