import { Module } from '@nestjs/common';

import { ApiModule } from '../api/api.module';
import { ChatModule } from '../chat/chat.module';
import { ContactController } from '../chat/controller/contact.controller';
import { ContactService } from '../chat/service/contact.service';
import { DbModule } from '../db/db.module';
import { KeyModule } from '../key/key.module';
import { LocationModule } from '../location/location.module';
import { MessageModule } from '../message/message.module';

@Module({
    imports: [DbModule, ChatModule, MessageModule, LocationModule, KeyModule, ApiModule],
    controllers: [ContactController],
    providers: [ContactService],
    exports: [ContactService],
})
export class ContactModule {}
