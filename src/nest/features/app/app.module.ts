import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from '../../config/config';
import { LocationModule } from '../location/location.module';
import Joi from 'joi';
import LoggerMiddleware from '../../middleware/logger.middleware';
import { DbModule } from '../db/db.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            validationSchema: Joi.object({
                PORT: Joi.number().required(),
                NODE_ENV: Joi.string().required(),
                REDIS_URL: Joi.string().required(),
            }),
            load: [config],
            isGlobal: true,
            cache: true,
        }),
        DbModule,
        LocationModule,
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
