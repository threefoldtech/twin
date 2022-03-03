import { Logger } from '@nestjs/common';
import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: '*', namespace: 'chat' })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('ChatGateway');

    @SubscribeMessage('message')
    handleIncomingMessage(@MessageBody() message: string): void {
        this.server.emit('message', message);
    }

    afterInit(server: Server) {
        this.logger.log('Chat gateway init');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Chat new connection: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Chat disconnected: ${client.id}`);
    }
}
