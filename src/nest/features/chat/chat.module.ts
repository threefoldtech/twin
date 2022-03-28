import { forwardRef, Module } from '@nestjs/common';

import { ApiModule } from '../api/api.module';
import { BlockedContactModule } from '../blocked-contact/blocked-contact.module';
import { ConnectionModule } from '../connection/connection.module';
import { DbModule } from '../db/db.module';
import { KeyModule } from '../key/key.module';
import { LocationModule } from '../location/location.module';
import { MessageModule } from '../message/message.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
    imports: [
        DbModule,
        YggdrasilModule,
        ConnectionModule,
        KeyModule,
        LocationModule,
        ApiModule,
        BlockedContactModule,
        forwardRef(() => MessageModule),
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
    exports: [ChatService, ChatGateway],
})
export class ChatModule {}
