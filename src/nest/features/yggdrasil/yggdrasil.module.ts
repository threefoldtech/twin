import { Module } from '@nestjs/common';
import { EncryptionModule } from '../encryption/encryption.module';
import { FileModule } from '../file/file.module';
import { YggdrasilService } from './service/yggdrasil.service';

@Module({
    imports: [EncryptionModule, FileModule],
    providers: [YggdrasilService],
    exports: [YggdrasilService],
})
export class YggdrasilModule {}
