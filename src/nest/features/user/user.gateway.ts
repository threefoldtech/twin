import { Logger } from '@nestjs/common';
import { MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { UserService } from './user.service';

@WebSocketGateway({ cors: '*' })
export class UserGateway implements OnGatewayInit {
    @WebSocketServer()
    private server: Server;

    private logger: Logger = new Logger('UserGateway');

    constructor(private readonly _userService: UserService) {}

    /**
     * Handles socket initialization.
     * @param {Server} server - socket.io server.
     */
    afterInit(server: Server) {
        this.logger.log(`user gateway setup successful`);
        this.server = server;
    }

    @SubscribeMessage('status_update')
    async handleStatusUpdate(@MessageBody() data: { status: string }): Promise<boolean> {
        return await this._userService.updateStatus({ status: data.status });
    }
}
