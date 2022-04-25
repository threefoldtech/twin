import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Post,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs-extra';

import { AuthGuard } from '../../guards/auth.guard';
import { imageFileFilter } from '../../utils/image-file-filter';
import { ConnectionService } from '../connection/connection.service';
import { LocalFilesInterceptor } from '../file/interceptor/local-files.interceptor';
import { KeyService } from '../key/key.service';
import { KeyType } from '../key/models/key.model';
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
    async getPublicKey(): Promise<string> {
        const pk = await this._keyService.getKey(KeyType.Public, this._configService.get<string>('userId'));
        return pk.key;
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
        let filePath = `${this._configService.get<string>('baseDir')}user/avatar-default`;
        if (avatarId !== 'default') {
            filePath = `${this._configService.get<string>('baseDir')}user/${avatarId}`;
        }
        const stream = createReadStream(filePath);
        return new StreamableFile(stream);
    }

    @Post('avatar')
    @UseGuards(AuthGuard)
    @UseInterceptors(
        LocalFilesInterceptor({
            fieldName: 'file',
            path: 'user',
            isAvatar: true,
            fileFilter: imageFileFilter,
            limits: {
                fileSize: Math.pow(2048, 2), // 2MB
            },
        })
    )
    uploadAvatar(@UploadedFile() file: Express.Multer.File): Promise<string> {
        if (!file) throw new BadRequestException('provide a valid image');
        const filename = file.filename.split('.')[0];
        return this._userService.updateAvatar({ path: filename });
    }
}
