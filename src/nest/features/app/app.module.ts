import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from '../../config/config';
import { LocationModule } from '../location/location.module';
import Joi from 'joi';
import LoggerMiddleware from '../../middleware/logger.middleware';
import { RedisModule } from 'nestjs-redis';

@Module({
    imports: [
        ConfigModule.forRoot({
            validationSchema: Joi.object({
                PORT: Joi.number().required(),
                NODE_ENV: Joi.string().required(),
                REDIS_HOST: Joi.string().required(),
                REDIS_PORT: Joi.number().required(),
                REDIS_DB: Joi.number().required(),
                REDIS_PASSWORD: Joi.string().required(),
            }),
            load: [config],
            isGlobal: true,
            cache: true,
        }),
        RedisModule.forRootAsync({
            useFactory: (configService: ConfigService) => configService.get('redis'),
            inject: [ConfigService],
        }),
        LocationModule,
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
