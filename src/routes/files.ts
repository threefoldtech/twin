import express, { Router } from 'express';
import { UploadedFile } from 'express-fileupload';

import { uuidv4 } from '../common';
import { config } from '../config/config';
import Message from '../models/message';
import { sendMessageToApi } from '../service/apiService';
import { getChat, persistChat, saveFile } from '../service/dataService';
import { appendSignatureToMessage } from '../service/keyService';
import { getMyLocation } from '../service/locationService';
import { parseMessage } from '../service/messageService';
import { sendEventToConnectedSockets } from '../service/socketService';
import { getFullIPv6ApiLocation } from '../service/urlService';
import { FileMessageType, MessageTypes } from '../types';
import { Path, saveTempFile } from '../utils/files';

const router = Router();

router.post('/upload', async (req: express.Request, res: express.Response) => {
    const file = req.files.file as UploadedFile;
    const fileId = uuidv4();
    const tempPath = new Path(`${fileId}`, '/appdata/tmp');

    await saveTempFile(tempPath, file);
    res.json(fileId);
});

router.get('/:chatid/:messageid/:name', async (req, res) => {
    // @TODO fix this security
    const path = `${config.baseDir}chats/${req.params.chatid}/files/${req.params.messageid}/${req.params.name}`;

    console.log(`PATH: ${path}`);

    res.download(path);
});

router.post('/:chatid/:messageid', async (req, resp) => {
    const chatId = req.params.chatid;
    const messageId = req.params.messageid;
    const fileToSave = <UploadedFile>req.files.file;
    saveFile(chatId, messageId, fileToSave);
    const myLocation = await getMyLocation();
    const message: Message<FileMessageType> = {
        from: config.userid,
        body: <FileMessageType>{
            type: req.body.type,
            filename: fileToSave.name,
            url: getFullIPv6ApiLocation(myLocation, `/v1/files/${chatId}/${messageId}/${fileToSave.name}`),
        },
        id: messageId,
        timeStamp: new Date(),
        to: chatId,
        type: MessageTypes.FILE,
        replies: [],
        signatures: [],
        subject: null,
    };
    sendEventToConnectedSockets('message', message);
    const chat = getChat(chatId);
    const messageToSend = parseMessage(message);
    appendSignatureToMessage(messageToSend);
    await sendMessageToApi(chat.contacts.find(contact => contact.id === chat.adminId).location, messageToSend);
    chat.addMessage(messageToSend);
    persistChat(chat);
    resp.sendStatus(200);
});

export default router;
