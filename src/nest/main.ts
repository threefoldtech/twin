import { NestFactory } from '@nestjs/core';
import { AppModule } from './features/app/app.module';

export default async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    return app;
}
