import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';

import { AuthGuard } from '../../guards/auth.guard';
import { LocalFilesInterceptor } from './file.interceptor';

@Controller('files')
export class FileController {
    @Post('upload')
    @UseGuards(AuthGuard)
    @UseInterceptors(
        LocalFilesInterceptor({
            fieldName: 'file',
            path: 'tmp',
            limits: {
                fileSize: Math.pow(2048, 20), // 20MB in bytes
            },
        })
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('please provide a valid file');
        return { id: file.filename, filename: file.originalname };
    }
}
