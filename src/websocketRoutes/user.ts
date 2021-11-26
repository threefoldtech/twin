import { Socket } from 'socket.io';
import { messageKernel, messageKernelWS } from '../middlewares/messageKernel';

module.exports = (socket: Socket) => {
    socket.on('get_avatar', (messageData, callback) => {
        console.log('get avatar from websocket', messageData);
        // updateDraftMessage(messageData);
        messageKernelWS(socket, 'get_avatar', callback);
        // socket.emit("answer", 'OK')
    });
};
