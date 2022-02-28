import { Module } from '@nestjs/common';

import { DbModule } from '../db/db.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { ConnectionService } from './service/connections.service';
import { KeyService } from './service/keys.service';

@Module({
    imports: [DbModule, EncryptionModule],
    providers: [KeyService, ConnectionService],
    exports: [KeyService, ConnectionService],
})
export class StoreModule {}
