import { Injectable, NotImplementedException } from '@nestjs/common';
import fs from 'fs';

@Injectable()
export class FileService {
    writeFile() {
        throw new NotImplementedException();
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
     * Checks if a file exists given its path.
     * @param {string} path - File path.
     * @return {boolean} file exists or not.
     */
    fileExists(path: string): boolean {
        return fs.existsSync(path);
    }
}
