import { Module } from '@nestjs/common';
import { YggdrasilService } from './service/yggdrasil.service';

@Module({
    providers: [YggdrasilService],
    exports: [YggdrasilService],
})
export class FileModule {}
