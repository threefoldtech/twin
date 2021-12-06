import { Socket } from 'socket.io';
import { messageKernelWS } from '../middlewares/messageKernel';
import { getMyLocation } from '../service/locationService';

export const WSMisc = (socket: Socket) => {
    socket.on('my_yggdrasil_address', async (data: Object, callback: Function) => {
        if (messageKernelWS(socket, 'my_yggdrasil_address', callback)) {
            callback({ data: await getMyLocation() });
        }
    });
};
