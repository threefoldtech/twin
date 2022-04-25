import { Module } from '@nestjs/common';

import { ConnectionModule } from '../connection/connection.module';
import { DbModule } from '../db/db.module';
import { KeyModule } from '../key/key.module';
import { LocationModule } from '../location/location.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { UserController } from './user.controller';
import { UserGateway } from './user.gateway';
import { UserService } from './user.service';

@Module({
    imports: [DbModule, ConnectionModule, KeyModule, LocationModule, YggdrasilModule],
    controllers: [UserController],
    providers: [UserService, UserGateway],
    exports: [UserService, UserGateway],
})
export class UserModule {}
