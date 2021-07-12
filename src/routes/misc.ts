import {Router} from 'express';
import {MessageTypes} from '../types';
import Chat from '../models/chat';
import {uuidv4} from '../common';
import {config} from '../config/config';
import {getChat, persistChat} from '../service/dataService';
import {getMyLocation} from '../service/locationService';
import http from "http";
import express from "express"
import {HttpError} from '../types/errors/httpError';
import {StatusCodes} from 'http-status-codes';

const router = Router();

router.get('/healthcheck', async (req, res) => {
    res.sendStatus(200);
});

router.get('/possibleMessages', async (req, res) => {
    res.json(MessageTypes);
});

router.get('/test', async (req, res) => {
    let id = uuidv4();
    getChat(id);
    const chat = new Chat(id, [], false, [], 'test', false, config.userid, {});

    persistChat(chat);
    res.json({success: true});
});

router.get('/yggdrasil_address', async (req, res) => {
    let myLocation = await getMyLocation();
    res.json(myLocation);
});

router.get('/getexternalresource', async (req: express.Request, res: express.Response) => {
    const resource = req.query.resource as string | undefined;
    if (!resource)
        throw new HttpError(StatusCodes.BAD_REQUEST, "No resource was given");
    http.get(resource, function (resp) {
        res.setHeader('content-disposition', "attachment");
        resp.pipe(res);
    });
})

export default router;
