import { INestApplication } from '@nestjs/common';
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
    const PORT = process.env.PORT ?? 3000;

    const nestApp = await bootstrapNest();
    nestApp.setGlobalPrefix(mountPath);
    nestApp.listen(+PORT + 1, () => {
        console.log(`nestjs server started on port ${+PORT + 1}`);
    });

    await nestApp.init();

    return app;
}

export default mountNestApp;
