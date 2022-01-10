import { removeFilePermissions, SharedFileInterface, updateShareName } from './../service/fileShareService';
import express, { json, Router } from 'express';
import {
    copyWithRetry,
    createDir,
    createDirectoryWithRetry,
    filterOnString,
    getFile,
    getFilesRecursive,
    getFormattedDetails,
    getStats,
    isPathDirectory,
    moveWithRetry,
    Path,
    readDir,
    removeFile,
    renameFile,
    saveFile,
    saveFileWithRetry,
} from '../utils/files';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';
import { DirectoryContent, DirectoryDto, FileDto, PathInfo } from '../types/dtos/fileDto';
import { UploadedFile } from 'express-fileupload';
import { requiresAuthentication } from '../middlewares/authenticationMiddleware';
import { createJwtToken, parseJwt, verifyJwtToken } from '../service/jwtService';
import { isBlocked, Permission, Token, TokenData } from '../store/tokenStore';
import syncRequest from 'sync-request';
import { config } from '../config/config';
import { uuidv4 } from '../common';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import {
    createShare,
    getShareByPath,
    getSharePermissionForUser,
    getSharesWithme,
    getShareWithId,
    removeShare,
    SharePermission,
    SharePermissionInterface,
    ShareStatus,
    updateSharePath,
} from '../service/fileShareService';
import { getChat, getShareConfig, persistShareConfig } from '../service/dataService';
import {
    FileShareMessageType,
    IdInterface,
    MessageBodyTypeInterface,
    MessageInterface,
    MessageTypes,
    StringMessageTypeInterface,
} from '../types';
import Message from '../models/message';
import { appendSignatureToMessage } from '../service/keyService';
import { sendMessageToApi } from '../service/apiService';
import { sendEventToConnectedSockets } from '../service/socketService';
import { persistMessage } from '../service/chatService';
import { parseMessage } from '../service/messageService';
import crypto from 'crypto';
import { getDocumentBrowserKey } from '../service/fileService';
import { isCallChain } from 'typescript';
import Contact from '../models/contact';
import { isUndefined } from 'lodash';
import { ConsoleTransportOptions } from 'winston/lib/winston/transports';
import chat from '../models/chat';
import { fromBuffer } from 'file-type';
import * as PATH from 'path';
import { pathExists } from 'fs-extra';

const router = Router();

interface FileToken extends TokenData {
    path: string;
    file: string;
}

router.get('/directories/content', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    let attachment = req.query.attachments === '1';

    if (!p || typeof p !== 'string') p = '/';
    let path = new Path(p);
    if (attachment) {
        path = new Path(p, '/appdata/attachments');
        if (!(await pathExists('/appdata/attachments' + p))) await createDir(path);
    }
    const stats = await getStats(path);
    if (
        !stats.isDirectory() ||
        stats.isBlockDevice() ||
        stats.isCharacterDevice() ||
        stats.isSymbolicLink() ||
        stats.isSocket()
    )
        throw new HttpError(StatusCodes.BAD_REQUEST, 'Path is not a directory');
    res.json(await readDir(path, { withFileTypes: true }, attachment));
});

router.get('/directories/info', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string') p = '/';
    const path = new Path(p);
    const stats = await getStats(path);
    if (
        !stats.isDirectory() ||
        stats.isBlockDevice() ||
        stats.isCharacterDevice() ||
        stats.isSymbolicLink() ||
        stats.isSocket()
    )
        throw new HttpError(StatusCodes.BAD_REQUEST, 'Path is not a directory');
    return getFormattedDetails(path);
});

router.post('/directories', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const dto = req.body as DirectoryDto;
    dto.name = dto.name.replace(/\\|\//g, '');
    if (!dto.path) dto.path = '/';
    if (!dto.name) dto.name = 'New Folder';
    const path = new Path(dto.path);
    path.appendPath(dto.name);
    const result = await createDirectoryWithRetry(path);
    res.status(StatusCodes.CREATED);
    res.json({
        name: result.name,
        isDirectory: true,
        isFile: false,
    } as DirectoryContent);
});

router.get('/files/info', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let p;
    let shareConfig = getShareConfig();
    if (req.query.params) {
        let params = Buffer.from(req.query.params as string, 'base64').toString();
        let object = JSON.parse(params);
        let shareId = object.shareId;
        let token = object.token;
        console.log(object);
        const [payload, err] = verifyJwtToken<Token<FileToken>>(token);
        if (err) throw new HttpError(StatusCodes.UNAUTHORIZED, err.message);
        if (
            !payload ||
            !payload.data ||
            payload.data.permissions.indexOf(Permission.FileBrowserRead) === -1 ||
            payload.data.file !== p
        )
            throw new HttpError(StatusCodes.UNAUTHORIZED, 'No permission for reading file');
        p = getShareWithId(shareId, ShareStatus.Shared).path;
    } else {
        p = req.query.path;
    }
    if (!p || typeof p !== 'string') throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');
    let path;
    req.query.attachments === 'true' ? (path = new Path(p, '/appdata/attachments')) : (path = new Path(p));

    res.json({
        ...(await getFormattedDetails(path)),
        key: getDocumentBrowserKey(true, path.securedPath),
        readToken: createJwtToken(
            {
                file: p,
                permissions: [Permission.FileBrowserRead],
            } as FileToken,
            5 * 60
        ),
        writeToken: createJwtToken(
            {
                file: p,
                permissions: [Permission.FileBrowserWrite],
            } as FileToken,
            24 * 60 * 60
        ),
    });
    res.status(StatusCodes.OK);
});

router.post('/files', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const files = req.files.newFiles as UploadedFile[] | UploadedFile;
    const dto = req.body as FileDto;

    if (!dto.path) dto.path = '/';
    if (Array.isArray(files)) {
        const results = [] as PathInfo[];
        await Promise.all(
            files.map(async f => {
                const path = new Path(dto.path);
                path.appendPath(f.name);
                const result = await saveFileWithRetry(path, f);
                results.push(result);
            })
        );
        res.json(results);
        res.status(StatusCodes.CREATED);
        return;
    }

    const path = new Path(dto.path);
    path.appendPath((files as UploadedFile).name);
    const result = await saveFileWithRetry(path, files as UploadedFile);
    res.json(result);
    res.status(StatusCodes.CREATED);
});

router.delete('/files', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const pathClass = new Path(req.body.filepath);
    removeShare(req.body.filepath);
    const result = await removeFile(pathClass);
    res.json(result);
    res.status(StatusCodes.CREATED);
});

router.get('/files', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string') throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

    const path = new Path(p);
    if (await isPathDirectory(path)) {
        const zip = new AdmZip();
        let uploadDir = fs.readdirSync(path.securedPath);

        for (let i = 0; i < uploadDir.length; i++) {
            zip.addLocalFile(path.securedPath + '/' + uploadDir[i]);
        }
        const data = zip.toBuffer();

        // code to download zip file
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment`);
        res.set('Content-Length', data.length.toString());
        res.send(data);
    } else {
        res.download(path.securedPath);
        res.status(StatusCodes.CREATED);
    }
});

interface OnlyOfficeCallback {
    key: string;
    status: number;
    url?: string;
}

router.get('/internal/files', async (req: express.Request, res: express.Response) => {
    const attachment: boolean = req.query.attachment === 'true';
    let p = req.query.path;
    let token = req.query.token;
    if (!token || typeof token !== 'string') throw new HttpError(StatusCodes.UNAUTHORIZED, 'No valid token provided');

    if (!p || typeof p !== 'string') throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

    if (isBlocked(token)) throw new HttpError(StatusCodes.FORBIDDEN, 'Provided token is blocked');

    const [payload, err] = verifyJwtToken<Token<FileToken>>(token);
    if (err) throw new HttpError(StatusCodes.UNAUTHORIZED, err.message);
    if (
        !payload ||
        !payload.data ||
        payload.data.permissions.indexOf(Permission.FileBrowserRead) === -1 ||
        payload.data.file !== p
    )
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'No permission for reading file');

    const path = new Path(p, undefined, attachment);
    res.download(path.securedPath);
    res.status(StatusCodes.OK);
});

router.post('/internal/files', async (req: express.Request, res: express.Response) => {
    const body = req.body as OnlyOfficeCallback;
    const token = req.query.token;
    if (!token || typeof token !== 'string') throw new HttpError(StatusCodes.UNAUTHORIZED, 'No valid token provided');

    if (body.status !== 2 && body.status !== 6) {
        res.json({ error: 0 });
        return;
    }

    if (isBlocked(token)) throw new HttpError(StatusCodes.FORBIDDEN, 'Provided token is blocked');

    const [payload, err] = verifyJwtToken<Token<FileToken>>(token);
    if (err) throw new HttpError(StatusCodes.UNAUTHORIZED, err.message);
    if (!payload || !payload.data || payload.data.permissions.indexOf(Permission.FileBrowserWrite) === -1)
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'No permission for reading file');

    if (!payload.data.file || !body.url) throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');
    const url = new URL(body.url);
    url.hostname = 'documentserver.digitaltwin-test.jimbertesting.be';
    url.protocol = 'https:';
    const fileResponse = syncRequest('GET', url);
    const fileBuffer = <Buffer>fileResponse.body;
    await saveFile(new Path(payload.data.file), fileBuffer);
    res.json({ error: 0 });
    res.status(StatusCodes.OK);
});

router.post('/files/copy', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const data = req.body.paths;
    if (!data || data.length === 0) throw new HttpError(StatusCodes.BAD_REQUEST, 'No items to copy specified');

    const destinationPath = req.body.destinationPath;
    if (!destinationPath) throw new HttpError(StatusCodes.BAD_REQUEST, 'No destinationpath specified');

    const result = await Promise.all(
        data.map(async (source: string) => copyWithRetry(new Path(source), new Path(destinationPath)))
    );
    res.json(result);
    res.status(StatusCodes.CREATED);
});

router.post('/files/move', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let config = getShareConfig();
    const data = req.body.paths;
    if (!data || data.length === 0) throw new HttpError(StatusCodes.BAD_REQUEST, 'No items to copy specified');

    const destinationPath = req.body.destinationPath;

    if (!destinationPath) throw new HttpError(StatusCodes.BAD_REQUEST, 'No destinationpath specified');
    const result = await Promise.all(
        data.map(async (source: string) => moveWithRetry(new Path(source), new Path(destinationPath)))
    );
    res.json(result);
    res.status(StatusCodes.CREATED);
});

router.put('/files/rename', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const oldPath = new Path(req.body.oldPath);
    const newPath = new Path(req.body.newPath);

    const allShares = getShareConfig();
    const share = allShares.Shared.find(share => share.path == oldPath.path);

    if (share) {
        updateSharePath(oldPath.path, newPath.path);
        updateShareName(share.id, newPath.path.split('/').pop());
    }

    const result = await renameFile(oldPath, newPath);

    res.json(result);
    res.status(StatusCodes.CREATED);
});

router.get('/files/search', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let term = req.query.searchTerm;
    let dir = req.query.currentDir;
    if (!dir || typeof dir !== 'string') throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

    const path = new Path(dir);
    let fileList = await getFilesRecursive(path);
    let filteredList = await filterOnString(term.toString(), fileList);

    const results = filteredList.length > 0 ? filteredList : 'None';
    res.json(results);
    res.status(StatusCodes.CREATED);
});

router.post(
    '/files/removeFilePermissions',
    requiresAuthentication,
    async (req: express.Request, res: express.Response) => {
        const chatId = req.body.chatId as string | undefined;
        const path = req.body.path as string | undefined;
        const location = req.body.path as string | undefined;
        removeFilePermissions(path, chatId, location);
        res.status(StatusCodes.OK);
    }
);

router.post('/files/share', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const path = req.body.path as string | undefined;
    const filename = req.body.filename as string | undefined;
    const isPublic = req.body.isPublic as boolean | undefined;
    const writable = req.body.writable as boolean | undefined;
    const chatId = req.body.chatId as string | undefined;

    if (!path) throw new HttpError(StatusCodes.BAD_REQUEST, 'No path specified');

    if (writable && isPublic) throw new HttpError(StatusCodes.BAD_REQUEST, 'No public writable files');

    if (!chatId) throw new HttpError(StatusCodes.BAD_REQUEST, 'No chat specified');

    const chat = getChat(chatId, 0);
    const itemStats = await getStats(new Path(path));

    const types = <SharePermission[]>[SharePermission.Read];
    if (writable) types.push(SharePermission.Write);

    const sharePermissions: SharePermissionInterface[] = [
        {
            chatId: chatId,
            types,
        },
    ];

    const allShares = getShareConfig();
    const existingShare = getShareByPath(allShares, path, ShareStatus.Shared);

    // const share = existingShare ? existingShare.permissions.find(p => p.chatId === chatId) ? existingShare : await createShare(path, filename, !itemStats.isFile(), itemStats.size, itemStats.mtime.getTime(), ShareStatus.Shared, sharePermissions) : await createShare(path, filename, !itemStats.isFile(), itemStats.size, itemStats.mtime.getTime(), ShareStatus.Shared, sharePermissions);;

    let share: SharedFileInterface;
    if (!isUndefined(existingShare)) {
        let id = existingShare.id;
        // if (!existingShare.permissions.find(p => p.chatId === chatId)) {
        share = await createShare(
            path,
            filename,
            !itemStats.isFile(),
            itemStats.size,
            itemStats.mtime.getTime(),
            ShareStatus.Shared,
            sharePermissions,
            id
        );
        // }
    } else {
        share = await createShare(
            path,
            filename,
            !itemStats.isFile(),
            itemStats.size,
            itemStats.mtime.getTime(),
            ShareStatus.Shared,
            sharePermissions
        );
    }

    let msg: Message<FileShareMessageType> = {
        id: uuidv4(),
        body: share,
        from: config.userid,
        to: chatId,
        timeStamp: new Date(),
        type: MessageTypes.FILE_SHARE,
        replies: [],
        signatures: [],
        subject: null,
    };
    const parsedmsg = parseMessage(msg);
    appendSignatureToMessage(parsedmsg);
    const contacts = chat.contacts.filter(c => c.id !== config.userid);
    for (const contact of contacts) {
        await sendMessageToApi(contact.location, parsedmsg);
    }

    persistMessage(chat.chatId, parsedmsg);
    sendEventToConnectedSockets('message', parsedmsg);
    res.json();
    res.status(StatusCodes.OK);
});

router.get('/files/getShares', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let shareStatus = req.query.shareStatus as ShareStatus;
    // console.log('status', shareStatus)
    let results = await getSharesWithme(shareStatus);
    res.json(results);
    res.status(StatusCodes.OK);
});

router.get('/attachments', requiresAuthentication, (req: express.Request, res: express.Response) => {
    const shareStatus = req.query.shareStatus as ShareStatus;

    const results = fs.readdirSync('/appdata/attachments/');

    res.json(results);
    res.status(StatusCodes.OK);
});

router.get('/files/getShareWithId', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let shareId = req.query.id as string;
    let results = await getShareWithId(shareId, ShareStatus.SharedWithMe);
    if (isUndefined(results)) {
        res.json({ message: 'ACCESS_DENIED' });
    } else {
        res.json(results);
    }
    res.status(StatusCodes.OK);
});
router.get(
    '/files/getSharedFileDownload',
    requiresAuthentication,
    async (req: express.Request, res: express.Response) => {
        let params = Buffer.from(req.query.params as string, 'base64').toString();
        let object = JSON.parse(params);
        let shareId = object.shareId;
        let token = object.token;

        if (!token || typeof token !== 'string')
            throw new HttpError(StatusCodes.UNAUTHORIZED, 'No valid token provided');
        if (isBlocked(token)) throw new HttpError(StatusCodes.FORBIDDEN, 'Provided token is blocked');

        const [payload, err] = verifyJwtToken<Token<FileToken>>(token);

        const share = getShareWithId(shareId, ShareStatus.Shared);
        if (!share.path || typeof share.path !== 'string')
            throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');
        if (err) throw new HttpError(StatusCodes.UNAUTHORIZED, err.message);
        if (!payload || !share.path || payload.data.permissions.indexOf(Permission.FileBrowserRead) === -1)
            throw new HttpError(StatusCodes.UNAUTHORIZED, 'No permission for reading file');

        const path = new Path(share.path);
        res.download(path.securedPath);
        res.status(StatusCodes.CREATED);
    }
);

router.get('/files/getShareFileAccessDetails', async (req: express.Request, res: express.Response) => {
    const shareId = <string>req.query.shareId;
    const share = getShareWithId(shareId, ShareStatus.Shared);
    if (!share) {
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'Share not found');
    }
    const userId = <string>req.query.userId;
    const givenPath = req.query.path;
    const userPermissions = getSharePermissionForUser(shareId, userId);
    console.log('USERPERMISSIONS', userId, userPermissions);
    if (userPermissions.length < 1) {
        res.json({ message: 'ACCESS_DENIED' });
        res.status(StatusCodes.OK);
        // throw new HttpError(StatusCodes.UNAUTHORIZED, 'No permissions to access the file.')
        return;
    }

    const userCanWrite = !!userPermissions.find(x => x === SharePermission.Write);

    let realPath = share.path;
    if (givenPath !== share.path) {
        realPath = realPath + givenPath;
    }
    const securePath = new Path(realPath);
    const key = getDocumentBrowserKey(userCanWrite, securePath.securedPath);
    const response = {
        ...(await getFormattedDetails(securePath)),
        key: key,
        readToken: createJwtToken(
            {
                file: realPath,
                permissions: [Permission.FileBrowserRead],
            } as FileToken,
            5 * 60
        ),
        writeToken: <string>undefined,
    };
    if (userCanWrite) {
        response['writeToken'] = createJwtToken(
            {
                file: realPath,
                permissions: [Permission.FileBrowserWrite],
            } as FileToken,
            24 * 60 * 60
        );
    }
    res.json(response);
    res.status(StatusCodes.OK);
});

router.get('/share/:shareId/folder', async (req: express.Request, res: express.Response) => {
    const shareId = req.params.shareId;
    let p = req.query.path;

    const share = getShareWithId(shareId, ShareStatus.Shared);

    if (!share) {
        throw new HttpError(StatusCodes.BAD_REQUEST, "Share doesn't exist");
    }

    // @todo verify if user can access this api call, atm security = 0

    if (!p || typeof p !== 'string') p = '/';
    const path = new Path(share.path + '/' + p);
    const stats = await getStats(path);
    if (
        !stats.isDirectory() ||
        stats.isBlockDevice() ||
        stats.isCharacterDevice() ||
        stats.isSymbolicLink() ||
        stats.isSocket()
    )
        throw new HttpError(StatusCodes.BAD_REQUEST, 'Path is not a directory');

    const resultDirs = await readDir(path, { withFileTypes: true });
    resultDirs.forEach(dir => (dir.path = dir.path.substring(share.path.length)));
    res.json(resultDirs);
    res.status(StatusCodes.OK);
});

router.get('/share/path', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const path = <string>req.query.path;
    const allShares = getShareConfig();
    let share = getShareByPath(allShares, path, ShareStatus.Shared);
    res.json(share);
    res.status(StatusCodes.OK);
});

router.get('/attachment/download', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const owner = <IdInterface>req.query.owner;
    const path = <string>req.query.path;
    const to = <string>req.query.to;
    const messageId = <string>req.query.messageId;

    const location = new URL(path).hostname.replace('[', '').replace(']', '');

    let msg: Message<StringMessageTypeInterface> = {
        id: uuidv4(),
        body: path,
        from: config.userid,
        to: owner,
        timeStamp: new Date(),
        type: MessageTypes.DOWNLOAD_ATTACHMENT,
        replies: [],
        signatures: [],
        subject: null,
    };

    let result: Buffer | undefined = undefined;

    if (owner === config.userid) {
        const path = `/appdata/chats/${to}/files/${messageId}`;
        const folder = fs.readdirSync(path);
        if (!folder || folder.length === 0) res.json('File does not exist');
        result = fs.readFileSync(path + '/' + folder[0]);
    }

    if (owner !== config.userid) {
        const parsedmsg = parseMessage(msg);
        appendSignatureToMessage(parsedmsg);
        result = (await sendMessageToApi(location, parsedmsg, 'arraybuffer')).data;
    }

    const file: UploadedFile = {
        name: null,
        data: Buffer.from(result),
        size: null,
        encoding: null,
        tempFilePath: null,
        truncated: null,
        //@ts-ignore
        mimetype: (await fromBuffer(Buffer.from(result, 'utf8')))?.mime || null,
        md5: null,
        mv: null,
    };

    const yy = await saveFileWithRetry(
        new Path(<string>owner + '/' + path.split('/').pop(), '/appdata/attachments/'),
        file,
        0,
        '/appdata/attachments/'
    );

    res.json('OK');
    res.status(StatusCodes.OK);
});

export default router;
