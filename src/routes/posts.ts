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

router.get('/:external', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    //Need boolean or else infinite loop
    const fetchPostsFromExternals = req?.params.external.toLowerCase() === 'true';

    let posts: any[] = [];

    //Getting posts from other twins
    if (fetchPostsFromExternals) {
        for (const contact of contacts) {
            const url = getFullIPv6ApiLocation(contact.location, '/posts/false');
            posts = (await axios.get(url)).data;
        }
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

router.get('/download/:path', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const path = atob(req.params.path);
    res.download(path);
});

router.put('/like/:postId', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const postId = req.params.postId;

    console.log('INSIDE LIKE   INSIDE LIKE    INSIDE LIKE   INSIDE LIKE');
    console.log(postId);

    let path = PATH.join(socialDirectory, 'posts', postId);
    console.log(path);
    if (fs.existsSync(path)) {
        console.log('Post is mine');
        //@ts-ignore
        let postConfig = JSON.parse(fs.readFileSync(`${path}/post.json`));
        const { likes } = postConfig;

        const myLocation = await getMyLocation();

        if (likes.some(e => e.location === myLocation)) {
            console.log('have already liked');
            console.log('going to delete like');
            postConfig.likes = postConfig.likes.filter(like => like.location !== myLocation);
            fs.writeFileSync(`${path}/post.json`, JSON.stringify(postConfig, null, 2));
            console.log('removed like');
            console.log(postConfig);
            res.json({ status: 'unliked' });
            return;
        }
        console.log('not liked');
        postConfig.likes.push({
            id: config.userid,
            location: myLocation,
        });
        console.log('liked');
        fs.writeFileSync(`${path}/post.json`, JSON.stringify(postConfig, null, 2));

        res.json({ status: 'liked' });

        return;
    }

    if (!fs.existsSync(path)) return res.json({ status: 'No post found' });

    res.json({ status: 'liked' });
});

//@TODO will need to use this later

export default router;
