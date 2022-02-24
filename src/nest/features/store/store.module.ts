import { Module } from '@nestjs/common';
import { KeyService } from './service/keys.service';

@Module({
    providers: [KeyService],
    exports: [KeyService],
})
export class StoreModule {}
