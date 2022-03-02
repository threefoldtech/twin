import { Module } from '@nestjs/common';

import { DbModule } from '../db/db.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { KeyService } from './service/key.service';

@Module({
    imports: [DbModule, EncryptionModule],
    providers: [KeyService],
    exports: [KeyService],
})
export class KeyModule {}
