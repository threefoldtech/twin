import { Socket } from 'socket.io';
import { messageKernelWS } from '../middlewares/messageKernel';
import { getBlocklist, persistBlocklist } from '../service/dataService';

export const WSBlock = (socket: Socket) => {
    socket.on('unblock_user', async (data: any, callback: Function) => {
        if (messageKernelWS(socket, 'unblock_user', callback, data.username)) {
            console.log('username from blocked entry is ', data);
            persistBlocklist(getBlocklist().filter(b => b != data.username));
            callback({ status: 'success' });
        }
    });

    socket.on('get_block_list', async (data: any, callback: Function) => {
        if (messageKernelWS(socket, 'get_block_list', callback)) {
            callback({ data: getBlocklist() });
        }
    });
};
