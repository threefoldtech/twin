import { Module } from '@nestjs/common';

import { StoreModule } from '../store/store.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { UserController } from './controller/user.controller';

@Module({
    imports: [StoreModule, YggdrasilModule],
    controllers: [UserController],
})
export class UserModule {}
