import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { FileService } from './file.service';

@Injectable()
export class FileSchedulingService {
    constructor(private readonly _fileService: FileService) {}

    @Interval(60000)
    clearTmpDirectory() {
        console.log(`Clearing tmp folder...`);
        this._fileService.clearFolder({ dir: 'tmp' });
    }
}
