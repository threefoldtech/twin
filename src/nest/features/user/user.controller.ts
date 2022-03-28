import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Post,
    Req,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs-extra';

import { AuthGuard } from '../../guards/auth.guard';
import { AuthenticatedRequest } from '../../types/requests';
import { imageFileFilter } from '../../utils/image-file-filter';
import { ConnectionService } from '../connection/connection.service';
import { LocalFilesInterceptor } from '../file/interceptor/local-files.interceptor';
import { KeyService } from '../key/key.service';
import { Key, KeyType } from '../key/models/key.model';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(
        private readonly _configService: ConfigService,
        private readonly _connectionService: ConnectionService,
        private readonly _keyService: KeyService,
        private readonly _userService: UserService
    ) {}

    @Get('publickey')
    @UseGuards(AuthGuard)
    async getPublicKey(): Promise<Key> {
        return await this._keyService.getKey(KeyType.Public);
    }

    @Get('status')
    async getStatus() {
        const isOnline = (await this._connectionService.getConnections()).length ? true : false;
        const userData = await this._userService.getUserData();
        const avatar = await this._userService.getUserAvatar();

        return {
            ...userData.entityData,
            avatar,
            isOnline,
        };
    }

    @Get('avatar/:avatarId')
    async getAvatar(@Param('avatarId') avatarId: string) {
        console.log(`Avatar: ${avatarId}`);
        const filePath = `${this._configService.get<string>('baseDir')}user/avatar-${avatarId}`;
        console.log(`FilePath: ${filePath}`);
        const stream = createReadStream(filePath);
        return new StreamableFile(stream);
    }

    @Post('avatar')
    @UseGuards(AuthGuard)
    @UseInterceptors(
        LocalFilesInterceptor({
            fieldName: 'file',
            path: '/users/avatars',
            isAvatar: true,
            fileFilter: imageFileFilter,
            limits: {
                fileSize: Math.pow(2048, 2), // 2MB
            },
        })
    )
    uploadAvatar(@Req() req: AuthenticatedRequest, @UploadedFile() file: Express.Multer.File): Promise<string> {
        if (!file) throw new BadRequestException('provide a valid image');
        return this._userService.addAvatar({ userId: req.userId, path: file.path });
    }
}
