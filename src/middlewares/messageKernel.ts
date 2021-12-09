import { StatusCodes } from 'http-status-codes';
import express, { Router } from 'express';
import { create, String } from 'lodash';
import { Path, saveFileWithRetry } from '../utils/files';
import { FileDto, PathInfo } from '../types/dtos/fileDto';
import { UploadedFile } from 'express-fileupload';
import { errorMiddleware } from '..';
import { HttpError } from '../types/errors/httpError';
import { Socket } from 'socket.io';
import { getAvatar } from '../store/user';

// responds back to the frontend over API.
// The respondance of the result will happen over websocket
const respondToInitialRequest = (socket: Socket, requirements: any, callback: any) => {
    if (!checkRequirements(requirements)) {
        callback({ ok: false });
        throw new Error('[!!!] Faulty params');
    }

    // res.json(msg);
    // res.status(400).send('bad reqeust');

    // if error
    // errorMiddleware(new HttpError(StatusCodes.CONFLICT, "X", "why not"), req, res, null)
    // res.status(StatusCodes.ACCEPTED);
};

const checkRequirements = (requirements: any) => {
    // return !!requirements;
    return true;
};

export const messageKernelWS = async (socket: Socket, messageAction: string, callback: any, data?: any) => {
    console.log('>>> MERNEL [', new Date(), '] <<<', messageAction);

    switch (messageAction) {
        case 'get_avatar':
            //check requirements for handleupload (e.g. file is added)
            //respond to request
            respondToInitialRequest(socket, null, callback);
            const image = await getAvatar();

            callback({ data: image });
            //handle request
            // handleUpload(req.files.newFiles, req.body);
            return;
        case 'get_my_status':
            respondToInitialRequest(socket, null, callback);
            return true;
        case 'my_yggdrasil_address':
            respondToInitialRequest(socket, null, callback);
            return true;
        case 'retrieve_chats':
            respondToInitialRequest(socket, null, callback);
            return true;
        case 'add_group_chat':
            respondToInitialRequest(socket, null, callback);
            return true;
        case 'fetch_messages':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'get_block_list':
            return true;
            respondToInitialRequest(socket, data, callback);
        case 'unblock_user':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'is_user_authenticated':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'get_directory_content':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'delete_file':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'search_dir':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'copy_files':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'move_file':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'rename_file':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'add_share':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'remove_file_permissions':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'get_shared_content':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'get_share_with_id':
            respondToInitialRequest(socket, data, callback);
            return true;
        case 'get_share_by_path':
            respondToInitialRequest(socket, data, callback);
            return true;
        default:
            console.log('resulted to default messageaction');
    }

    return false;
};

const handleUpload = async (files: UploadedFile[] | UploadedFile, dto: FileDto) => {
    // console.log("UPLOAD REQUEST RECEIVED", files, dto)
    // if (!dto.path) dto.path = '/';
    // if (Array.isArray(files)) {
    //   console.log("array of files")
    //   const results = [] as PathInfo[];
    //   await Promise.all(
    //     files.map(async f => {
    //       const path = new Path(dto.path);
    //       path.appendPath(f.name);
    //       const result = await saveFileWithRetry(path, f);
    //       results.push(result);
    //     })
    //   );
    //   res.json(results);
    //   res.status(StatusCodes.CREATED);
    //   // send this message though websocket, catch and dispatch to messageKernel
    //   return;
    // }
    // const path = new Path(dto.path);
    // path.appendPath((files as UploadedFile).name);
    // const result = await saveFileWithRetry(path, files as UploadedFile);
    // res.json(result);
    // res.status(StatusCodes.CREATED);
};
