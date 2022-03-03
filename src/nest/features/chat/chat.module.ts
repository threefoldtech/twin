import { Module } from '@nestjs/common';

import { ConnectionModule } from '../connection/connection.module';
import { DbModule } from '../db/db.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { ChatController } from './controller/chat.controller';
import { ChatGateway } from './gateway/chat.gateway';
import { ChatService } from './service/chat.service';

@Module({
    imports: [DbModule, YggdrasilModule, ConnectionModule],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
})
export class ChatModule {}
