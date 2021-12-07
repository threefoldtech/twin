import { StatusCodes } from 'http-status-codes';
import { isUndefined, result } from 'lodash';
import { Socket } from 'socket.io';
import { uuidv4 } from '../common';
import { config } from '../config/config';
import { messageKernelWS } from '../middlewares/messageKernel';
import Message from '../models/message';
import { sendMessageToApi } from '../service/apiService';
import { persistMessage } from '../service/chatService';
import { getBlocklist, getChat, getShareConfig, persistBlocklist } from '../service/dataService';
import {
    createShare,
    getShareByPath,
    removeFilePermissions,
    removeShare,
    SharedFileInterface,
    SharePermission,
    SharePermissionInterface,
    ShareStatus,
    updateShareName,
    updateSharePath,
} from '../service/fileShareService';
import { appendSignatureToMessage } from '../service/keyService';
import { parseMessage } from '../service/messageService';
import { sendEventToConnectedSockets } from '../service/socketService';
import { FileShareMessageType, MessageTypes } from '../types';
import { HttpError } from '../types/errors/httpError';
import {
    copyWithRetry,
    filterOnString,
    getFilesRecursive,
    getFormattedDetails,
    getStats,
    moveWithRetry,
    Path,
    readDir,
    removeFile,
    renameFile,
} from '../utils/files';

export const WSFileBrowser = (socket: Socket) => {
    socket.on('get_directory_content', async (data: any, callback: Function) => {
        if (messageKernelWS(socket, 'get_directory_content', callback, data.path)) {
            console.log('directory content entry is ', data);

            let p = data.path;
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

            let result = { status: 200, data: await readDir(path, { withFileTypes: true }) };

            callback(result);
        }

        socket.on('delete_file', async (data: any, callback: Function) => {
            if (messageKernelWS(socket, 'delete_file', callback, data.path)) {
                const pathClass = new Path(data.path);
                removeShare(data.path);
                let result = { status: StatusCodes.CREATED, data: await removeFile(pathClass) };
                callback(result);
            }
        });

        socket.on('search_dir', async (data: any, callback: Function) => {
            if (messageKernelWS(socket, 'delete_file', callback, data.path)) {
                let term = data.params.searchTerm;
                let dir = data.params.currentDir;
                if (!dir || typeof dir !== 'string') throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');
                const path = new Path(dir);
                let fileList = await getFilesRecursive(path);
                let filteredList = await filterOnString(term.toString(), fileList);
                const results = filteredList.length > 0 ? filteredList : 'None';
                let result = { status: StatusCodes.OK, data: results };
                callback(result);
            }
        });

        socket.on('copy_files', async (params: any, callback: Function) => {
            if (messageKernelWS(socket, 'copy_files', callback, params.params.paths)) {
                const data = params.params;
                console.log('data', data);
                if (!data || data.length === 0)
                    throw new HttpError(StatusCodes.BAD_REQUEST, 'No items to copy specified');

                const destinationPath = data.destinationPath;
                if (!destinationPath) throw new HttpError(StatusCodes.BAD_REQUEST, 'No destinationpath specified');

                const result = await Promise.all(
                    data.paths.map(async (source: string) => copyWithRetry(new Path(source), new Path(destinationPath)))
                );

                let output = { status: StatusCodes.OK, data: result };
                console.log('copy_file', output);
                callback(output);
            }
        });

        socket.on('move_file', async (params: any, callback: Function) => {
            if (messageKernelWS(socket, 'move_file', callback, params.params.paths)) {
                let config = getShareConfig();
                const data = params.params.paths;
                if (!data || data.length === 0)
                    throw new HttpError(StatusCodes.BAD_REQUEST, 'No items to copy specified');

                const destinationPath = params.params.destinationPath;

                if (!destinationPath) throw new HttpError(StatusCodes.BAD_REQUEST, 'No destinationpath specified');
                const result = await Promise.all(
                    data.map(async (source: string) => moveWithRetry(new Path(source), new Path(destinationPath)))
                );
                // res.json(result);
                // res.status(StatusCodes.CREATED);

                let output = { status: StatusCodes.OK, data: result };
                callback(output);
            }
        });

        socket.on('add_share', async (params: any, callback: Function) => {
            if (messageKernelWS(socket, 'add_share', callback, params.params.paths)) {
                const path = params.params.path as string | undefined;
                const filename = params.params.filename as string | undefined;
                const isPublic = params.params.isPublic as boolean | undefined;
                const writable = params.params.writable as boolean | undefined;
                const chatId = params.params.chatId as string | undefined;

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

                let output = { status: StatusCodes.OK };
                callback(output);
            }
        });

        socket.on('remove_file_permissions', async (params: any, callback: Function) => {
            if (messageKernelWS(socket, 'remove_file_permissions', callback)) {
                const chatId = params.params.chatId as string | undefined;
                const path = params.params.path as string | undefined;
                const location = params.params.path as string | undefined;

                removeFilePermissions(path, chatId, location);

                let output = { status: StatusCodes.OK };
                callback(output);
            }
        });

        socket.on('rename_file', async (params: any, callback: Function) => {
            if (messageKernelWS(socket, 'rename_file', callback)) {
                const oldPath = new Path(params.params.oldPath);
                const newPath = new Path(params.params.newPath);

                const allShares = getShareConfig();
                const share = allShares.Shared.find(share => share.path == oldPath.path);

                if (share) {
                    updateSharePath(oldPath.path, newPath.path);
                    updateShareName(share.id, newPath.path.split('/').pop());
                }

                const result = await renameFile(oldPath, newPath);

                let output = { status: StatusCodes.OK, data: result };
                callback(output);
            }
        });
    });
};
