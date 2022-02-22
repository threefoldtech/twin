import { Application } from 'express';

import bootstrapNest from '../main';

export default async function mountNestAp(app: Application, mountPath: string, bootstrapNest: Function) {
    const nestApp = await bootstrapNest();
    await nestApp.init();

    app.use(mountPath, nestApp.getHttpAdapter().getInstance());
    return app;
}
