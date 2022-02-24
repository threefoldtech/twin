import { Module } from '@nestjs/common';

import { EncryptionService } from './service/encryption.service';

@Module({
    providers: [EncryptionService],
    exports: [EncryptionService],
})
export class EncryptionModule {}
