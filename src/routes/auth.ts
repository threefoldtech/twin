import { Router } from 'express';

import { yggdrasilIsInitialized } from '../index';
import { appCallback, getAppLoginUrl } from '../service/authService';
import { initYggdrasil } from '../service/yggdrasilService';

const router = Router();

router.get('/', async (request, response) => {
    console.log('in session: ', request.session);
    if (!request.session.loggedIn && process.env.ENVIRONMENT !== 'development') {
        console.log('We dont have a loggedIn session, we shouldnt login now.');
        response.json({ status: false });
    }

    response.json({ status: true });
});

router.get('/signin', async (request, response) => {
    let loginUrl = await getAppLoginUrl(request, `/api/v1/auth/callback`);
    loginUrl = loginUrl + '&username=' + request.query.username;

    console.log('url: ', loginUrl);
    response.redirect(loginUrl);
});

router.get('/signout', async (request, response) => {
    const promise = new Promise<void>((resolve, reject) => {
        request.session.destroy(err => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });

    try {
        await promise;
        response.json({ success: true });
    } catch (err) {
        response.json({ success: false });
    }
});

router.get('/callback', async (request, response) => {
    const callback = await appCallback(request);

    if (callback && callback !== '/unauthorized') {
        console.log('request.session: ', request.session);
    }

    request.session.save(() => {
        response.redirect(callback);
    });
});

router.get('/authenticated', async (request, response) => {
    const hasSession = !!request?.session?.userId;
    if (!hasSession) {
        response.send('false');
        return;
    }

    if (!yggdrasilIsInitialized) {
        initYggdrasil();
    }

    const isProduction = process.env.ENVIRONMENT !== 'development';

    if (isProduction && !yggdrasilIsInitialized) {
        response.send('false');
        return;
    }

    response.send('true');
});

export default router;
