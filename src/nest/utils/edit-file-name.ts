import { Request } from 'express';
import { extname } from 'path';

/**
 * Helper function for NestJS FileInterceptor.
 * Transforms uploaded file name to random file name unless randomName = false. (For avatar creation)
 * @param {File} file - Original uploaded express multer file.
 * @param {Function} callback - Callback function.
 * @param {boolean} randomName - Whether to generate a random name or not.
 */
export function editFileName({
    file,
    callback,
    randomName = true,
}: {
    _: Request;
    file: Express.Multer.File;
    callback: (error: Error, newFileName: string) => void;
    randomName?: boolean;
}): void {
    const fileExtName = extname(file.originalname);

    if (!randomName) {
        callback(null, `avatar${fileExtName}`);
    }

    const name = file.originalname.split('.')[0];
    const newRandomName = Array(4)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');

    callback(null, `${name}-${newRandomName}${fileExtName}`);
}
