import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Post,
    Req,
    StreamableFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
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

    @Get('avatar/:userId')
    async getAvatar(@Param('userId') userId: string): Promise<StreamableFile> {
        const filePath = await this._userService.getAvatar(userId);
        const stream = createReadStream(join(process.cwd(), filePath));
        return new StreamableFile(stream);
    }

    // TODO: create avatar.png and fetch like this.
    @Post('avatar')
    // @UseGuards(AuthGuard)
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
    uploadAvatar(@Req() req: AuthenticatedRequest, @UploadedFiles() uploads: Array<Express.Multer.File>) {
        if (!uploads) throw new BadRequestException('provide a valid image');
        console.log(uploads);
        // return this._userService.addAvatar({ userId: req.userId, fileName: '' });
    }
}
