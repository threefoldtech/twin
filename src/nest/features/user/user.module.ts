import { Module } from '@nestjs/common';

import { StoreModule } from '../store/store.module';
import { UserController } from './controller/user.controller';

@Module({
    imports: [StoreModule],
    controllers: [UserController],
})
export class UserModule {}
