import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway()
export class ChatGateway {
    @SubscribeMessage('new-message')
    handleNewChat(@MessageBody() message: string): string {
        return message;
    }
}
