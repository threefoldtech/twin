import {
    BadRequestException,
    Controller,
    Get,
    Post,
    Req,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs-extra';
import { join } from 'path';

import { AuthGuard } from '../../../guards/auth.guard';
import { AuthenticatedRequest } from '../../../types/requests';
import { imageFileFilter } from '../../../utils/image-file-filter';
import { LocalFilesInterceptor } from '../../file/interceptor/local-files.interceptor';
import { Key } from '../../store/models/key.model';
import { ConnectionService } from '../../store/service/connections.service';
import { KeyService } from '../../store/service/keys.service';
import { UserService } from '../../store/service/user.service';

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

    @Get('avatar')
    async getAvatar(): Promise<StreamableFile> {
        const filePath = `${this._configService.get<string>(
            'uploadDestination'
        )}/users/avatars/${this._configService.get<string>('userId')}-avatar.png`;
        const stream = createReadStream(join(process.cwd(), filePath));
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
