import { Socket } from 'socket.io';
import { messageKernel, messageKernelWS } from '../middlewares/messageKernel';
import { updateDraftMessage } from '../service/chatService';
import { getAvatar } from '../service/contactService';
import { connections } from '../store/connections';
import { getLastSeen, getStatus } from '../store/user';

// module.exports = (socket: Socket) => {
//     // socket.on('get_avatar', (messageData, callback) => {
//     //     console.log('get avatar from websocket', messageData);
//     //     // updateDraftMessage(messageData);
//     //     messageKernelWS(socket, 'get_avatar', callback);
//     //     // socket.emit("answer", 'OK')
//     // });
//     socket.on('get_my_status', async (messageData, callback) => {
//         console.log('get get_my_status from websocket', messageData);
//         console.log('get get_my_status from websocket', messageData);
//         console.log('get get_my_status from websocket', messageData);
//         console.log('get get_my_status from websocket', messageData);
//         console.log('get get_my_status from websocket', messageData);
//         console.log('get get_my_status from websocket', messageData);
//         console.log('get get_my_status from websocket', messageData);
//         updateDraftMessage(messageData);
//         if(messageKernelWS(socket, 'get_avatar', callback)){
//             const isOnline = connections.getConnections().length ? true : false;
//             const status = getStatus();
//             const avatar = await getAvatar();
//             const lastSeen = getLastSeen();
//             const data = {
//                 status,
//                 avatar,
//                 isOnline,
//                 lastSeen,
//             };
//             callback({data: data})
//         };
//     });
// };

export const test = (socket: Socket) => {
    console.log('testing ');
};
export const getMyStatus = (socket: Socket) => {
    socket.on('get_my_status', async (messageData, callback) => {
        console.log('get get_my_status from websocket', messageData);
        console.log('get get_my_status from websocket', messageData);
        console.log('get get_my_status from websocket', messageData);
        console.log('get get_my_status from websocket', messageData);
        console.log('get get_my_status from websocket', messageData);
        console.log('get get_my_status from websocket', messageData);
        console.log('get get_my_status from websocket', messageData);
        // updateDraftMessage(messageData);
        if (messageKernelWS(socket, 'get_avatar', callback)) {
            console.log('testing return');
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
