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

    //Saving post with paths//

    res.json({ status: 'success' });
});

router.get('/:external', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    //Need boolean or else infinite loop
    const fetchPostsFromExternals = req?.params.external.toLowerCase() === 'true';

    let posts: any[] = [];

    //Getting posts from other twins
    if (fetchPostsFromExternals) {
        for (const contact of contacts) {
            //Checking if user is online
            try {
                const url = getFullIPv6ApiLocation(contact.location, '/posts/false');
                posts = (
                    await axios.get(url, {
                        timeout: 1000,
                    })
                ).data;
            } catch (e) {
                console.log("Can't make connection with other twin");
            }
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

router.get('/single/post', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const creatorPost = <string>req.query.location;
    const postId = <string>req.query.postId;
    const myLocation = await getMyLocation();

    if (myLocation !== creatorPost) {
        try {
            const url = getFullIPv6ApiLocation(creatorPost, '/posts/single/post');
            const post = (
                await axios.get(url, {
                    timeout: 2000,
                    params: {
                        location: creatorPost,
                        postId: postId,
                    },
                })
            ).data;
            console.log(post);
            res.json(post);
            return;
        } catch (e) {
            //console.log("Can't make connection with other twin");
            throw new Error(`Post couldn't be found`);
        }
    }

    const path = PATH.join(socialDirectory, 'posts', postId);
    if (!fs.existsSync(path)) throw new Error(`Post couldn't be found`);
    //@ts-ignore
    const post = JSON.parse(fs.readFileSync(`${path}/post.json`));

    res.json(post);
});

router.put('/typing', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const creatorPost = <string>req.body.location;
    const postId = <string>req.body.postId;
    const myLocation = await getMyLocation();
    if (myLocation !== creatorPost) {
        const url = getFullIPv6ApiLocation(creatorPost, `/posts/typing`);
        await axios.put(url, {
            ...req.body,
        });
        res.json({ status: 'OK' });
        return;
    }

    for (const contact of contacts) {
        const url = getFullIPv6ApiLocation(contact.location, `/posts/someoneIsTyping`);
        axios.post(url, req.body, {
            timeout: 1000,
        });
    }
    sendEventToConnectedSockets('post_typing', postId);
    res.json({ status: 'OK' });
});

router.post('/someoneIsTyping', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const postId = <string>req.body.postId;
    sendEventToConnectedSockets('post_typing', postId);
    res.json({ status: 'OK' });
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
});

router.put('/comment/:postId', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const postId = req.params.postId;
    const { id, body, owner, post, type, replies, createdOn, likes, replyTo, isReplyToComment } = req.body;
    //console.log('COMMENT');
    const myLocation = await getMyLocation();
    if (post.owner.location !== myLocation) {
        //Sending to other twin
        const url = getFullIPv6ApiLocation(post.owner.location, `/posts/comment/${postId}`);
        const { data: status } = await axios.put(url, req.body);
        //console.log(status);
        return res.json({ ...status });
    }
    //Okay post is mine
    const path = PATH.join(socialDirectory, 'posts', postId);
    if (!fs.existsSync(path)) return res.json({ status: 'post not found' });
    //@ts-ignore
    let postConfig = JSON.parse(fs.readFileSync(`${path}/post.json`));
    //Now checking if reply or not
    if (isReplyToComment) {
        //console.log(postConfig?.replies[replyTo]);
        //@ts-ignore
        const parentCommentId = postConfig.replies.findIndex(obj => obj.id === replyTo);

        //console.log(postConfig.replies[parentCommentId]);
        postConfig?.replies[parentCommentId]?.replies.push(req.body);
        fs.writeFileSync(`${path}/post.json`, JSON.stringify(postConfig, null, 2));
        res.json({ status: 'commented' });
        return;
    }
    postConfig.replies.push(req.body);
    fs.writeFileSync(`${path}/post.json`, JSON.stringify(postConfig, null, 2));

    res.json({ status: 'commented' });
});

//@TODO will need to use this later

export default router;
