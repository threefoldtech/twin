import { Module } from '@nestjs/common';
import { DbService } from './service/db.service';

@Module({
    imports: [],
    providers: [DbService],
})
export class DbModule {}
