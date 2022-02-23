import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './features/app/app.module';

/**
 * Bootstrap creates and returns a NestJS application.
 * @return {INestApplication} The NestJS application.
 */
export default async function bootstrap(): Promise<INestApplication> {
    const app = await NestFactory.create(AppModule);
    return app;
}
