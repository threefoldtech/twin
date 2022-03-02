import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

import config from '../../config/config';
import { LoggerMiddleware } from '../../middleware/logger.middleware';
import { ApiModule } from '../api/api.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { DbModule } from '../db/db.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { FileModule } from '../file/file.module';
import { LocationModule } from '../location/location.module';
import { UserModule } from '../user/user.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            validationSchema: Joi.object({
                PORT: Joi.number().required(),
                NODE_ENV: Joi.string().required(),
                BASE_DIR: Joi.string().required(),
                UPLOAD_DESTINATION: Joi.string().required(),
                REDIS_URL: Joi.string().required(),
                DIGITALTWIN_APPID: Joi.string().required(),
                USER_ID: Joi.string().required(),
                SEED_PHRASE: Joi.string().required(),
            }),
            load: [config],
            isGlobal: true,
            cache: true,
        }),
        DbModule,
        ApiModule,
        AuthModule,
        EncryptionModule,
        FileModule,
        YggdrasilModule,
        LocationModule,
        UserModule,
        ChatModule,
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
