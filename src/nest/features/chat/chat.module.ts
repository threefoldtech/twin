import { Module } from '@nestjs/common';

import { ApiModule } from '../api/api.module';
import { ConnectionModule } from '../connection/connection.module';
import { DbModule } from '../db/db.module';
import { KeyModule } from '../key/key.module';
import { LocationModule } from '../location/location.module';
import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { BlockedContactController } from './controller/blocked-contact.controller';
import { ChatController } from './controller/chat.controller';
import { ContactController } from './controller/contact.controller';
import { MessageController } from './controller/message.controller';
import { ChatGateway } from './gateway/chat.gateway';
import { BlockedContactService } from './service/blocked-contact.service';
import { ChatService } from './service/chat.service';
import { ContactService } from './service/contact.service';
import { MessageService } from './service/message.service';

@Module({
    imports: [DbModule, YggdrasilModule, ConnectionModule, KeyModule, LocationModule, ApiModule],
    controllers: [ChatController, ContactController, BlockedContactController, MessageController],
    providers: [ChatService, ContactService, BlockedContactService, MessageService, ChatGateway],
})
export class ChatModule {}
