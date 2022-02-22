import { NestFactory } from '@nestjs/core';
import { AppModule } from './features/app/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    app.enableCors();
    await app.listen(3010, '0.0.0.0');
}

bootstrap();
