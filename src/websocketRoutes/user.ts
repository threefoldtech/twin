import { Socket } from 'socket.io';
import { messageKernel, messageKernelWS } from '../middlewares/messageKernel';
import { updateDraftMessage } from '../service/chatService';
import { getAvatar } from '../service/contactService';
import { connections } from '../store/connections';
import { getLastSeen, getStatus } from '../store/user';

export const getMyStatus = (socket: Socket) => {
    socket.on('get_my_status', async (messageData, callback) => {
        if (messageKernelWS(socket, 'get_my_status', callback)) {
            const isOnline = connections.getConnections().length ? true : false;
            const status = getStatus();
            const avatar = await getAvatar();
            const lastSeen = getLastSeen();
            const data = {
                status,
                avatar,
                isOnline,
                lastSeen,
            };
            callback({ data: data });
        }
    });
};
