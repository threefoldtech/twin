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
}) {
    const nestApp = await bootstrapNest();
    await nestApp.init();

    nestApp.useWebSocketAdapter(new IoAdapter(app));

    app.use(mountPath, nestApp.getHttpAdapter().getInstance());
    // TODO: fix socket.io connection issues to return app instead of nestApp
    return nestApp;
}

export default mountNestApp;
