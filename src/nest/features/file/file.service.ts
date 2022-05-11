import { Injectable } from '@nestjs/common';
import fs from 'fs';
import { join } from 'path';

@Injectable()
export class FileService {
    /**
     * Writes a file to the file system given the path and body
     * @param {Object} obj - Object.
     * @param {string} obj.path - File path.
     * @param {string} obj.content - File contents.
     */
    writeFile({ path, content }: { path: string; content: string }) {
        if (!this.fileExists({ path })) fs.writeFileSync(path, content);
    }

    /**
     * Reads and returns a JSON file.
     * @param {Object} obj - Object.
     * @param {string} obj.path - File path.
     * @return {string} file.
     */
    readJSONFile({ path }: { path: string }): string {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }

    /**
     * Returns an integer representing the file descriptor.
     * @param {Object} obj - Object.
     * @param {string} obj.path - File path.
     * @param {string} obj.flags - File flags.
     * @return {number} descriptor.
     */
    openFile({ path, flags }: { path: string; flags: string }): number {
        return fs.openSync(path, flags);
    }

    /**
     * Checks if a file exists given its path.
     * @param {Object} obj - Object.
     * @param {string} obj.path - File path.
     * @return {boolean} file exists or not.
     */
    fileExists({ path }: { path: string }): boolean {
        return fs.existsSync(path);
    }

    /**
     * Clears the contents of a directory.
     * @param {Object} obj - Object.
     * @param {string} obj.dir - Directory path.
     * @return {boolean} directory cleared or not.
     */
    clearFolder({ dir }: { dir: string }): boolean {
        fs.readdir(dir, (err, files) => {
            if (err) throw err;

            files.forEach(file => {
                fs.unlink(join(dir, file), err => {
                    if (err) throw err;
                });
            });
        });
        return true;
    }
}
