import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Application } from 'express';

/**
 * Mounts NestJS application to existing Express app.
 * @param {Application} app - The existing Express application.
 * @param {string} mountPath - API endpoint path.
 * @param {Function} bootstrapNest - Callback function that bootstraps the NestJS application.
 * @return {Application} The Express application merged with NestJS
 */
async function mountNestApp({
    app,
    mountPath,
    bootstrapNest,
}: {
    app: Application;
    mountPath: string;
    bootstrapNest: { (): Promise<INestApplication> };
}): Promise<Application> {
    const nestApp = await bootstrapNest();
    await nestApp.init();

    const httpServer = nestApp.getHttpServer();
    nestApp.useWebSocketAdapter(new IoAdapter(httpServer));
    app.use(mountPath, nestApp.getHttpAdapter().getInstance());
    return app;
}

export default mountNestApp;
