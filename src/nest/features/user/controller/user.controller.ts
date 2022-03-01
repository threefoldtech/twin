import { Controller, Get, NotImplementedException, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../../guards/auth.guard';
import { Key } from '../../store/models/key.model';
import { ConnectionService } from '../../store/service/connections.service';
import { KeyService } from '../../store/service/keys.service';
import { UserService } from '../../store/service/user.service';

@Controller('user')
export class UserController {
    constructor(
        private readonly _connectionService: ConnectionService,
        private readonly _keyService: KeyService,
        private readonly _userService: UserService
    ) {}

    @Get('publickey')
    async getPublicKey(): Promise<Key> {
        return await this._keyService.getPublicKey();
    }

    @Get('status')
    @UseGuards(AuthGuard)
    async getStatus() {
        const isOnline = (await this._connectionService.getConnections()).length ? true : false;
        const userData = await this._userService.getUserData();

        return {
            userData,
            isOnline,
        };
    }

    @Get('avatar/:avatarID')
    getAvatar(@Param('id', ParseIntPipe) id: number) {
        throw new NotImplementedException();
    }

    @Post('avatar')
    @UseGuards(AuthGuard)
    uploadAvatar() {
        throw new NotImplementedException();
    }
}
