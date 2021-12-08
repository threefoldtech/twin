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
import { getMyLocation } from '../service/locationService';
import { contacts } from '../store/contacts';
import { getFullIPv6ApiLocation } from '../service/urlService';
import axios from 'axios';

const router = Router();

const socialDirectory = PATH.join(config.baseDir, '/social');

router.post('/', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const { id, type, body, isGroupPost, createdOn, lastModified } = req.body;
    let filesToSave = <UploadedFile[]>req?.files.images;

    if (Object.prototype.toString.call(filesToSave) !== '[object Array]') {
        filesToSave = [].concat(filesToSave);
    }

    console.log(filesToSave);

    let path = PATH.join(socialDirectory, 'posts', id, 'files');
    fs.mkdirSync(path, { recursive: true });

    let images = [];

    for (const file of filesToSave) {
        if (file?.tempFilePath && file?.mv) {
            //@ts-ignore
            file.mv(PATH.join(path, file.name));
            images.push({ ...file, path: PATH.join(path, file.name) });
        } else if (file?.data) {
            fs.writeFileSync(PATH.join(path, file.name), file.data);
        }
    }

    const pathConfig = PATH.join(socialDirectory, 'posts', id);
    //Todo Restrict file size

    const json = {
        post: {
            id,
            type,
            body,
            isGroupPost,
            createdOn,
            lastModified,
        },
        owner: {
            id: config.userid,
            location: await getMyLocation(),
        },
        likes: [] as any[],
        replies: [] as any[],
        images: images,
    };

    fs.writeFileSync(`${pathConfig}/post.json`, JSON.stringify(json, null, 2));

    //Saving post with paths

    res.json({ status: 'success' });
});

router.get('/', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let posts: any[] = [];
    for (const contact of contacts) {
        const url = getFullIPv6ApiLocation(contact.location, '/posts/external');
        const peersPosts = (await axios.get(url)).data;
        posts = peersPosts;
    }

    let path = PATH.join(socialDirectory, 'posts');

    if (!fs.existsSync(path)) return res.json(posts);
    const dir = await fs.promises.opendir(path);
    for await (const dirent of dir) {
        //@ts-ignore
        const file = JSON.parse(fs.readFileSync(`${path}/${dirent.name}/post.json`));
        posts.push(file);
    }
    res.json(posts);
});

router.get('/external', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let path = PATH.join(socialDirectory, 'posts');
    let posts: any[] = [];

    if (!fs.existsSync(path)) return res.json(posts);
    const dir = await fs.promises.opendir(path);
    for await (const dirent of dir) {
        //@ts-ignore
        const file = JSON.parse(fs.readFileSync(`${path}/${dirent.name}/post.json`));
        posts.push(file);
    }
    res.json(posts);
});

router.get('/download/:path', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const path = atob(req.params.path);
    res.download(path);
});

//@TODO will need to use this later

export default router;
