import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { messageKernelWS } from '../middlewares/messageKernel';
import { getBlocklist, persistBlocklist } from '../service/dataService';
import { HttpError } from '../types/errors/httpError';
import { getStats, Path, readDir } from '../utils/files';

export const WSFileBrowser = (socket: Socket) => {
    socket.on('get_directory_content', async (data: any, callback: Function) => {
        if (messageKernelWS(socket, 'get_directory_content', callback)) {
            console.log('directory content entry is ', data);

            let p = data.path;
            if (!p || typeof p !== 'string') p = '/';
            const path = new Path(p);
            const stats = await getStats(path);
            if (
                !stats.isDirectory() ||
                stats.isBlockDevice() ||
                stats.isCharacterDevice() ||
                stats.isSymbolicLink() ||
                stats.isSocket()
            )
                throw new HttpError(StatusCodes.BAD_REQUEST, 'Path is not a directory');

            let result = { status: 200, data: await readDir(path, { withFileTypes: true }) };

            callback(result);
        }
    });
};
