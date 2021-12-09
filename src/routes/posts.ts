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
    const creatorPost = req.body.owner;
    const liker_location = req.body.liker_location;
    const liker_id = req.body.liker_id;
    const myLocation = await getMyLocation();

    //Note: check first config.userid === location from post, get postId in body of put. Or else infinite loop if the post was deleted
    let path = PATH.join(socialDirectory, 'posts', postId);
    if (myLocation === creatorPost) {
        if (!fs.existsSync(path)) return res.json({ status: 'post not found' });
        //@ts-ignore
        let postConfig = JSON.parse(fs.readFileSync(`${path}/post.json`));
        const { likes } = postConfig;
        //@ts-ignore
        if (likes.some(e => e.location === liker_location && e.id === liker_id)) {
            postConfig.likes = postConfig.likes.filter(
                //@ts-ignore
                like => like.location !== liker_location && like.id !== liker_id
            );
            fs.writeFileSync(`${path}/post.json`, JSON.stringify(postConfig, null, 2));
            res.json({ status: 'unliked' });
            return;
        }
        postConfig.likes.push({
            id: liker_id,
            location: liker_location,
        });
        fs.writeFileSync(`${path}/post.json`, JSON.stringify(postConfig, null, 2));
        res.json({ status: 'liked' });
        return;
    }
    //Sending to other twin
    const url = getFullIPv6ApiLocation(creatorPost, `/posts/like/${postId}`);
    const status = (
        await axios.put(url, {
            owner: creatorPost,
            liker_location: liker_location,
            liker_id: liker_id,
        })
    ).data;
    res.json({ ...status });

    res.json({ status: 'liked' });
});

//@TODO will need to use this later

export default router;
