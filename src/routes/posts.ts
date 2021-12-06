import { IdInterface } from '../types/index';
import express, { json, Router } from 'express';
import { getChatById } from '../service/chatService';
import { getChat, persistChat } from '../service/dataService';
import { sendEventToConnectedSockets } from '../service/socketService';
import { config } from '../config/config';
import { requiresAuthentication } from '../middlewares/authenticationMiddleware';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';

const router = Router();

router.post('/', requiresAuthentication, (req: express.Request, res: express.Response) => {
    const text = req.body.text;
    const files = req?.files;

    res.json({ status: 'success' });
});

router.get('/', requiresAuthentication, (req: express.Request, res: express.Response) => {});

//@TODO will need to use this later

export default router;
