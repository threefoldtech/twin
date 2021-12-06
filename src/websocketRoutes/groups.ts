import axios from 'axios';
import { Socket } from 'socket.io';
import { messageKernelWS } from '../middlewares/messageKernel';
import { parseFullChat } from '../service/chatService';
import { persistChat } from '../service/dataService';
import { getFullIPv6ApiLocation } from '../service/urlService';

export const WSGroup = (socket: Socket) => {
    socket.on('add_group_chat', async (data: any, callback: Function) => {
        if (messageKernelWS(socket, 'add_group_chat', callback)) {
            let preParsedChat = { ...data, acceptedChat: true, isGroup: true };
            const chat = parseFullChat(preParsedChat);
            persistChat(chat);

            chat.contacts.forEach(async c => {
                const path = getFullIPv6ApiLocation(c.location, '/group/invite');
                // sending group invite requests to all parties over api
                try {
                    await axios.put(path, chat);
                } catch (e) {
                    console.log('failed to send group request');
                }
            });
            callback({ success: true });
        }
    });
};
