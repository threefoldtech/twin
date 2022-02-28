import { Module } from '@nestjs/common';

import { EncryptionModule } from '../encryption/encryption.module';
import { StoreModule } from '../store/store.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';

@Module({
    imports: [EncryptionModule, StoreModule, YggdrasilModule],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
