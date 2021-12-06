import { Socket } from 'socket.io';
import { messageKernelWS } from '../middlewares/messageKernel';
import { getChat } from '../service/dataService';

export const WSMessages = (socket: Socket) => {
    socket.on('fetch_messages', async (data: any, callback: Function) => {
        const chat = getChat(data.chatId);
        if (messageKernelWS(socket, 'fetch_messages', callback, chat)) {
            const chatId = data.chatId;
            const fromId = <string | undefined>data.params.fromId;
            const page = parseInt(<string | undefined>data.page);
            let limit = parseInt(<string | undefined>data.params.limit);
            limit = limit > 100 ? 100 : limit;
            let end = chat.messages.length;
            if (page) end = chat.messages.length - page * limit;
            else if (fromId) end = chat.messages.findIndex(m => m.id === fromId);

            const start = end - limit < 0 ? 0 : end - limit;
            callback({ hasMore: start !== 0, messages: chat.messages.slice(start, end) });
        }
    });
};
