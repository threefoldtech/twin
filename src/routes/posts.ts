import { IdInterface } from '../types/index';
import express, { json, Router } from 'express';
import { getChatById } from '../service/chatService';
import { getChat, persistChat } from '../service/dataService';
import { sendEventToConnectedSockets } from '../service/socketService';
import { config } from '../config/config';
import { requiresAuthentication } from '../middlewares/authenticationMiddleware';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';
import * as PATH from 'path';
import fs from 'fs';
import { UploadedFile } from 'express-fileupload';
import {getMyLocation} from "../service/locationService";


const router = Router();

const socialDirectory = PATH.join(config.baseDir, '/social');

router.post('/', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const { id, type, body, isGroupPost, createdOn, lastModified } = req.body;
    let filesToSave = <UploadedFile[]>req?.files.images;

    if(Object.prototype.toString.call(filesToSave) !== '[object Array]') {
        filesToSave = [].concat(filesToSave);
    }

    console.log(filesToSave)

    let path = PATH.join(socialDirectory, 'posts', id, 'files');
    fs.mkdirSync(path, { recursive: true });

    let images = [];

    for (const file of filesToSave) {
        if (file.tempFilePath && file.mv) {
            //@ts-ignore
            file.mv(PATH.join(path, file.name));
            images.push({...file, path: PATH.join(path, file.name)})
        } else if (file.data) {
            fs.writeFileSync(PATH.join(path, file.name), file.data);
        }
    }

    const pathConfig = PATH.join(socialDirectory, 'posts', id);
    //Restrict file size

    const json = {
        post: {
            id, type, body, isGroupPost, createdOn, lastModified
        },
        owner: {
            id: config.userid,
            location: await getMyLocation()
        },
        likes: [] as any[],
        replies: [] as any[],
        images: images
    }

    fs.writeFileSync(`${pathConfig}/post.json`, JSON.stringify(json, null ,2))

    //Saving post with paths

    res.json({ status: 'success' });
});

router.get('/', requiresAuthentication, (req: express.Request, res: express.Response) => {





});

//@TODO will need to use this later

export default router;
