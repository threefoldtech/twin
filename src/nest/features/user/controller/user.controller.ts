import { Controller, Get, NotImplementedException, Param, ParseIntPipe, Post } from '@nestjs/common';

import { Key } from '../../store/models/key.model';
import { ConnectionService } from '../../store/service/connections.service';
import { KeyService } from '../../store/service/keys.service';

@Controller('user')
export class UserController {
    constructor(private readonly _connectionService: ConnectionService, private readonly _keyService: KeyService) {}

    @Get('publickey')
    async getPublicKey(userID: string): Promise<Key> {
        return await this._keyService.getPublicKey(userID);
    }

    @Get('status')
    async getStatus() {
        // TODO: continue here
        const isOnline = (await this._connectionService.getConnections()).length ? true : false;
        throw new NotImplementedException();
    }

    @Get('avatar/:avatarID')
    getAvatar(@Param('id', ParseIntPipe) id: number) {
        throw new NotImplementedException();
    }

    @Post('avatar')
    uploadAvatar() {
        throw new NotImplementedException();
    }
}
