import express, { Router } from 'express';
import http from 'http';
import { StatusCodes } from 'http-status-codes';

import { uuidv4 } from '../common';
import { config } from '../config/config';
import Chat from '../models/chat';
import { getChatById } from '../service/chatService';
import { getChat, persistChat } from '../service/dataService';
import { getMyLocation } from '../service/locationService';
import { MessageTypes } from '../types';
import { HttpError } from '../types/errors/httpError';

const router = Router();

router.get('/healthcheck', async (req, res) => {
    res.sendStatus(200);
});

router.post('/updateDraft', (req: express.Request, res: express.Response) => {
    const draftMessage = req.body.params.draftMessage;
    console.log(draftMessage);
    const chatWithUpdatedDraft = getChatById(draftMessage.to);
    chatWithUpdatedDraft.draft = draftMessage;
    persistChat(chatWithUpdatedDraft);
    res.sendStatus(200);
});
router.get('/possibleMessages', async (req, res) => {
    res.json(MessageTypes);
});

router.get('/test', async (req, res) => {
    const id = uuidv4();
    getChat(id);
    const chat = new Chat(id, [], false, [], 'test', false, config.userid, {});

    persistChat(chat);
    res.json({ success: true });
});

router.get('/yggdrasil_address', async (req, res) => {
    const myLocation = await getMyLocation();
    res.json(myLocation);
});

// router.get('/getexternalresource', async (req: express.Request, res: express.Response) => {
//     const resource = req.query.resource as string | undefined;
//     if (!resource) throw new HttpError(StatusCodes.BAD_REQUEST, 'No resource was given');
//     http.get(resource, function (resp) {
//         // Setting the response headers correctly
//         // resp.rawheaders = [key1,value1,key2,value2]
//         // get length of headers
//         // set response header as (key1,value1)
//         // jump with 2 cause you had the first combo
//         const length = resp.rawHeaders.length;
//         let index = 0;
//         while (index < length) {
//             // console.log(resp.rawHeaders[index] + "     "+resp.rawHeaders[index+1])
//             res.setHeader(resp.rawHeaders[index], resp.rawHeaders[index + 1]);
//             index += 2;
//         }
//         resp.pipe(res);
//     });
// });

export default router;
