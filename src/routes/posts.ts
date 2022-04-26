import axios from 'axios';
import express, { Router } from 'express';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import * as PATH from 'path';

import { config } from '../config/config';
import { requiresAuthentication } from '../middlewares/authenticationMiddleware';
import { getBlocklist } from '../service/dataService';
import { getMyLocation } from '../service/locationService';
import { sendEventToConnectedSockets } from '../service/socketService';
import { getFullIPv6ApiLocation } from '../service/urlService';
import { contacts } from '../store/contacts';
import { StatusCodes } from 'http-status-codes';
import { POST_ACTIONS, POST_MODEL, SOCIAL_POST } from '../types';
import { sendPostToApi } from '../service/apiService';

const router = Router();

const socialDirectory = PATH.join(config.baseDir, '/social');

router.post('/', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const { id, type, body, isGroupPost, createdOn, lastModified } = req.body;
    let filesToSave = <UploadedFile[]>req?.files.images;

    if (Object.prototype.toString.call(filesToSave) !== '[object Array]') {
        filesToSave = [].concat(filesToSave);
    }

    const path = PATH.join(socialDirectory, 'posts', id, 'files');
    fs.mkdirSync(path, { recursive: true });

    const images = [];

    for (const file of filesToSave) {
        if (file?.tempFilePath && file?.mv) {
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
        likes: [] as unknown[],
        replies: [] as unknown[],
        images: images,
    };

    fs.writeFileSync(`${pathConfig}/post.json`, JSON.stringify(json, null, 2));

    //Saving post with paths//

    res.json({ status: 'success' });
});

router.get('/:external', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    //Need boolean or else infinite loop
    const fetchPostsFromExternals = req?.params.external.toLowerCase() === 'true';

    let posts: unknown[] = [];

    //Getting posts from other twins
    if (fetchPostsFromExternals) {
        for (const contact of contacts) {
            //Checking if user is online
            try {
                const url = getFullIPv6ApiLocation(contact.location, '/v1/posts/false');
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

    const path = PATH.join(socialDirectory, 'posts');

    if (!fs.existsSync(path)) return res.json(posts);
    const dir = await fs.promises.opendir(path);
    const blockedUsers = getBlocklist();
    for await (const dirent of dir) {
        const file = JSON.parse(fs.readFileSync(`${path}/${dirent.name}/post.json`).toString());
        if (blockedUsers.includes(file.owner.id)) return;
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
            const url = getFullIPv6ApiLocation(creatorPost, '/v1/posts/single/post');
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
    const post = JSON.parse(fs.readFileSync(`${path}/post.json`).toString());

    res.json(post);
});

router.post('/someoneIsTyping', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const postId = <string>req.body.postId;
    const userId = req.body.userId;

    const data = {
        post: postId,
        user: userId,
    };
    sendEventToConnectedSockets('post_typing', data);
    res.json({ status: 'OK' });
});

router.get('/download/:path', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const path = atob(req.params.path);
    console.log(`PATH`, path);
    res.download(path);
});

router.put('/', async (req: express.Request, res: express.Response) => {
    const post = req.body;
    if (!post) return;
    console.log('got here ', post);
    console.log('as user ', config.userid);
    res.status(StatusCodes.OK);
    res.send();
});

router.put('/typing', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const creatorPost = <string>req.body.location;
    const postId = <string>req.body.postId;
    const userId = req.body.userId;
    const myLocation = await getMyLocation();
    if (myLocation !== creatorPost) {
        const url = getFullIPv6ApiLocation(creatorPost, `/v1/posts/typing`);
        await axios.put(url, {
            ...req.body,
        });
        res.json({ status: 'OK' });
        return;
    }

    for (const contact of contacts) {
        const url = getFullIPv6ApiLocation(contact.location, `/v1/posts/someoneIsTyping`);
        axios.post(url, req.body);
    }

    const data = {
        post: postId,
        user: userId,
    };
    sendEventToConnectedSockets('post_typing', data);
    res.json({ status: 'OK' });
});

router.put('/like/:postId', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const postId = req.params.postId;
    const creatorPost = req.body.owner;
    const liker_location = req.body.liker_location;
    const liker_id = req.body.liker_id;
    const myLocation = await getMyLocation();

    //Note: check first config.userid === location from post, get postId in body of put. Or else infinite loop if the post was deleted
    const path = PATH.join(socialDirectory, 'posts', postId);
    if (myLocation === creatorPost) {
        if (!fs.existsSync(path)) return res.json({ status: 'post not found' });
        const postConfig = JSON.parse(fs.readFileSync(`${path}/post.json`).toString());
        const { likes } = postConfig;
        if (likes.some((e: { location: string; id: string }) => e.location === liker_location && e.id === liker_id)) {
            postConfig.likes = postConfig.likes.filter(
                (like: { location: string; id: string }) => like.location !== liker_location && like.id !== liker_id
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
    const url = getFullIPv6ApiLocation(creatorPost, `/v1/posts/like/${postId}`);
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
    const { post, replyTo, isReplyToComment } = req.body;
    const myLocation = await getMyLocation();
    if (post.owner.location !== myLocation) {
        //Sending to other twin
        const url = getFullIPv6ApiLocation(post.owner.location, `/v1/posts/comment/${postId}`);
        const { data: status } = await axios.put(url, req.body);
        //console.log(status);
        return res.json({ ...status });
    }
    //Okay post is mine
    const path = PATH.join(socialDirectory, 'posts', postId);
    if (!fs.existsSync(path)) return res.json({ status: 'post not found' });
    const postConfig = JSON.parse(fs.readFileSync(`${path}/post.json`).toString());
    //Now checking if reply or not
    if (isReplyToComment) {
        //console.log(postConfig?.replies[replyTo]);
        const parentCommentId = postConfig.replies.findIndex((obj: { id: string }) => obj.id === replyTo);

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

router.delete('/:postId', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const postId: string = req.params.postId;
    const path = PATH.join(socialDirectory, 'posts', postId);
    if (!fs.existsSync(path)) throw new Error('Could not find post');
    const post: SOCIAL_POST = JSON.parse(fs.readFileSync(`${path}/post.json`).toString());
    if (post?.owner.location !== (await getMyLocation())) throw new Error('Not your post!');
    fs.rmdirSync(path, { recursive: true });
    sendEventToConnectedSockets('post_deleted', postId);
    for (let contact of contacts) {
        const p: POST_MODEL = {
            ...post.post,
            action: POST_ACTIONS.POST_DELETE,
        };
        console.log('post ', p);
        await sendPostToApi(contact.location, p);
        // const parsedMessage = parseMessage(msg);
        // appendSignatureToMessage(parsedMessage);
        //todo make sendPostToApi or something similar like messages but for all posts updates
        // sendMessageToApi(contact.location, parsedMessage);
    }
    res.status(StatusCodes.OK);
    res.send();
});

export default router;
