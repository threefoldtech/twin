import { Module } from '@nestjs/common';

import { DbModule } from '../db/db.module';
import { BlockedContactController } from './blocked-contact.controller';
import { BlockedContactService } from './blocked-contact.service';

@Module({
    imports: [DbModule],
    controllers: [BlockedContactController],
    providers: [BlockedContactService],
    exports: [BlockedContactService],
})
export class BlockedContactModule {}
