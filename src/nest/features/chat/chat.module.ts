import { Module } from '@nestjs/common';

import { ConnectionModule } from '../connection/connection.module';
import { DbModule } from '../db/db.module';
import { KeyModule } from '../key/key.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { ChatController } from './controller/chat.controller';
import { ContactController } from './controller/contact.controller';
import { ChatGateway } from './gateway/chat.gateway';
import { ChatService } from './service/chat.service';
import { ContactService } from './service/contact.service';

@Module({
    imports: [DbModule, YggdrasilModule, ConnectionModule, KeyModule],
    controllers: [ChatController, ContactController],
    providers: [ChatService, ContactService, ChatGateway],
})
export class ChatModule {}
