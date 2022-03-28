import { Module } from '@nestjs/common';

import { DbModule } from '../db/db.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { BlockedContactController } from './blocked-contact.controller';
import { BlockedContactService } from './blocked-contact.service';

@Module({
    imports: [DbModule, YggdrasilModule],
    controllers: [BlockedContactController],
    providers: [BlockedContactService],
    exports: [BlockedContactService],
})
export class BlockedContactModule {}
