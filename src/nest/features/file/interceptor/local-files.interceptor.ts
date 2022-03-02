import { Injectable, mixin, NestInterceptor, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface LocalFilesInterceptorOptions {
    fieldName: string;
    path?: string;
    isAvatar?: boolean;
    fileFilter?: MulterOptions['fileFilter'];
    limits?: MulterOptions['limits'];
}

export function LocalFilesInterceptor(options: LocalFilesInterceptorOptions): Type<NestInterceptor> {
    @Injectable()
    class Interceptor implements NestInterceptor {
        fileInterceptor: NestInterceptor;
        constructor(private readonly _configService: ConfigService) {
            const filesDestination = this._configService.get<string>('uploadDestination');

            const destination = `${filesDestination}${options.path}`;

            const multerOptions: MulterOptions = {
                storage: diskStorage({
                    destination,
                    filename: (_, file, callback) => {
                        if (options.isAvatar) callback(null, `avatar${extname(file.originalname)}`);

                        callback(null, file.originalname);
                    },
                }),
                fileFilter: options.fileFilter,
                limits: options.limits,
            };

            this.fileInterceptor = new (FileInterceptor(options.fieldName, multerOptions))();
        }

        intercept(...args: Parameters<NestInterceptor['intercept']>) {
            return this.fileInterceptor.intercept(...args);
        }
    }

    return mixin(Interceptor);
}
