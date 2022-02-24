import { Module } from '@nestjs/common';

import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { EncryptionModule } from '../encryption/encryption.module';
import { StoreModule } from '../store/store.module';

@Module({
    imports: [EncryptionModule, StoreModule],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
