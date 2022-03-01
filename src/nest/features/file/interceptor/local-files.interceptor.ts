import { Injectable, mixin, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';

interface LocalFilesInterceptorOptions {
    fieldName: string;
    path?: string;
    fileFilter?: MulterOptions['fileFilter'];
    limits?: MulterOptions['limits'];
}

const LocalFilesInterceptor = (options: LocalFilesInterceptorOptions) => {
    @Injectable()
    class Interceptor implements NestInterceptor {
        fileInterceptor: NestInterceptor;
        constructor(private readonly _configService: ConfigService) {
            const filesDestination = this._configService.get<string>('uploadDestination');

            const destination = `${filesDestination}${options.path}`;

            const multerOptions: MulterOptions = {
                storage: diskStorage({
                    destination,
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
};

export default LocalFilesInterceptor;
