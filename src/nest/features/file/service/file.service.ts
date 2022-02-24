import { Injectable } from '@nestjs/common';
import fs from 'fs';

@Injectable()
export class FileService {
    /**
     * Writes a file to the file system given the path and body
     * @param {string} path - File path.
     * @param {string} content - File contents.
     */
    writeFile({ path, content }: { path: string; content: string }) {
        fs.writeFileSync(path, content);
    }

    /**
     * Reads and returns a JSON file.
     * @param {string} path - File path.
     * @return {string} file.
     */
    readJSONFile(path: string): string {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    }

    /**
     * Returns an integer representing the file descriptor.
     * @param {string} path - File path.
     * @param {string} flags - File flags.
     * @return {number} descriptor.
     */
    openFile({ path, flags }: { path: string; flags: string }): number {
        return fs.openSync(path, flags);
    }

    /**
     * Checks if a file exists given its path.
     * @param {string} path - File path.
     * @return {boolean} file exists or not.
     */
    fileExists(path: string): boolean {
        return fs.existsSync(path);
    }
}
