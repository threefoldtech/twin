import { Socket } from 'socket.io';
import { messageKernelWS } from '../middlewares/messageKernel';
import { getAcceptedChatsWithPartialMessages, getChatById } from '../service/chatService';
import { persistChat } from '../service/dataService';
import { sendEventToConnectedSockets } from '../service/socketService';
import { IdInterface } from '../types';

export const WSChats = (socket: Socket) => {
    socket.on('retrieve_chats', async (data: any, callback: Function) => {
        if (messageKernelWS(socket, 'retrieve_chats', callback)) {
            let limit = parseInt(<string | undefined>data.limit);
            limit = limit > 100 ? 100 : limit;
            const chats = getAcceptedChatsWithPartialMessages(limit);
            callback({ data: chats });
        }
    });

    socket.on('accept_chat', async (data: any, callback: Function) => {
        if (messageKernelWS(socket, 'retrieve_chats', callback, data.id)) {
            //Flow to add contact request to contacts
            const id: IdInterface = <IdInterface>data.id;
            console.log('accepting', id);
            let chat = getChatById(id);
            chat.acceptedChat = true;
            sendEventToConnectedSockets('new_chat', chat);
            persistChat(chat);
        }
        callback({ data: 'ok' });
    });
};
