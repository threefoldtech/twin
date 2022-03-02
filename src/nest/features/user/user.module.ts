import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { StoreModule } from '../store/store.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { UserController } from './controller/user.controller';

@Module({
    imports: [MulterModule.register({}), StoreModule, YggdrasilModule],
    controllers: [UserController],
})
export class UserModule {}
