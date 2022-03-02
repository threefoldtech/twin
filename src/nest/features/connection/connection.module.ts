import { Module } from '@nestjs/common';

import { DbModule } from '../db/db.module';
import { ConnectionService } from './service/connection.service';

@Module({
    imports: [DbModule],
    providers: [ConnectionService],
    exports: [ConnectionService],
})
export class ConnectionModule {}
