import { Module } from '@nestjs/common';

import { StoreModule } from '../store/store.module';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';

@Module({
    imports: [StoreModule],
    providers: [UserService],
    exports: [UserService],
    controllers: [UserController],
})
export class UserModule {}
