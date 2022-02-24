import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileService } from '../../file/service/file.service';
import PATH from 'path';
import { EncryptionService } from '../../encryption/service/encryption.service';

@Injectable()
export class YggdrasilService {
    private initialised: boolean = false;

    private configPath: string = '';
    private jsonPath: string = '';

    constructor(
        private readonly _configService: ConfigService,
        private readonly _encryptionService: EncryptionService,
        private readonly _fileService: FileService
    ) {
        const baseDir = _configService.get<string>('baseDir');
        this.configPath = PATH.join(baseDir, 'yggdrasil.conf');
        this.jsonPath = PATH.join(baseDir, 'user', 'yggdrasil.json');
    }

    /**
     * Returns true if yggdrasil is initialised
     * @return {boolean} - Initialised or not
     */
    isInitialised(): boolean {
        return this.initialised;
    }

    async setupYggdrasil(seed: string) {
        const chatSeed = `${seed}-chat`;
    }

    private getReplacements(seed: string) {
        if (this._fileService.fileExists(this.jsonPath)) {
            console.log(`Existing replacements for yggdrasil found`);
            return this._fileService.readJSONFile(this.jsonPath);
        }
        const hash = this._encryptionService.generateHashFromSeed(seed);
    }
}
