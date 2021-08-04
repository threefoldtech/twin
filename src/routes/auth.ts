import { Router } from 'express';
import { appCallback, getAppLoginUrl } from '../service/authService';
import {yggdrasilIsInitialized} from "../index";
import {HttpError} from "../types/errors/httpError";
import {StatusCodes} from "http-status-codes";
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
    let loginUrl = await getAppLoginUrl(request, `/api/auth/callback`);
    loginUrl = loginUrl + "&username=" + request.query.username

    console.log('url: ', loginUrl);
    response.redirect(loginUrl);
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
    const isDevelopmentMode =  process.env.ENVIRONMENT === 'development';
    if (!hasSession && (!isDevelopmentMode || !yggdrasilIsInitialized)) {
        response.send('true');
        return;
    }
    response.send('false');
});

export default router;
