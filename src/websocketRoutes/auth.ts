import { request } from 'express';
import { Socket } from 'socket.io';
import { yggdrasilIsInitialized } from '..';
import { messageKernelWS } from '../middlewares/messageKernel';
import { getAvatar } from '../service/contactService';
import { connections } from '../store/connections';
import { getLastSeen, getStatus } from '../store/user';

export const WSAuth = (socket: Socket) => {
    socket.on('is_user_authenticated', async (data, callback) => {
        console.log('here');
        if (messageKernelWS(socket, 'is_user_authenticated', callback)) {
            console.log('data', data);

            const hasSession = !!request?.session?.userId;
            console.log('has session', hasSession);
            const isDevelopmentMode = process.env.ENVIRONMENT === 'development';
            if (!hasSession && (!isDevelopmentMode || !yggdrasilIsInitialized)) {
                callback({ response: 'false' });
                return;
            }
            callback({ response: 'true' });
        }
    });
};
