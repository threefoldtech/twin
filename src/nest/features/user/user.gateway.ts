import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { uuidv4 } from '../../utils/uuid';
import { ApiService } from '../api/api.service';
import { ContactService } from '../contact/contact.service';
import { MessageDTO } from '../message/dtos/message.dto';
import { StatusUpdate } from '../message/types/message.type';
import { UserService } from './user.service';

@WebSocketGateway({ cors: '*' })
export class UserGateway implements OnGatewayInit {
    @WebSocketServer()
    private server: Server;

    private logger: Logger = new Logger('UserGateway');

    constructor(
        private readonly _userService: UserService,
        private readonly _contactService: ContactService,
        private readonly _apiService: ApiService,
        private readonly _configService: ConfigService
    ) {}

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

    async getConnections(): Promise<number> {
        const sockets = await this.server.allSockets();
        return sockets.size;
    }

    /**
     * Handles a new socket.io client connection.
     */
    async handleConnection() {
        const contacts = await this._contactService.getContacts();
        Promise.all(
            contacts.map(async c => {
                const resource = `http://[${c.location}]/api/v2/user/status`;
                const { data } = await this._apiService.getExternalResource({ resource });
                await this._apiService.sendStatusUpdate({ location: c.location, status: data });
            })
        );
    }

    /**
     * Handles a socket.io client disconnection.
     */
    async handleDisconnect() {
        const contacts = await this._contactService.getContacts();
        Promise.all(
            contacts.map(async c => {
                const resource = `http://[${c.location}]/api/v2/user/status`;
                const { data } = await this._apiService.getExternalResource({ resource });
                await this._apiService.sendStatusUpdate({ location: c.location, status: data });
            })
        );
    }
}
