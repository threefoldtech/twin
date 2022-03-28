import { forwardRef, Module } from '@nestjs/common';

import { ApiModule } from '../api/api.module';
import { ChatModule } from '../chat/chat.module';
import { MessageController } from '../chat/controller/message.controller';
import { MessageService } from '../chat/service/message.service';
import { ContactModule } from '../contact/contact.module';
import { DbModule } from '../db/db.module';
import { KeyModule } from '../key/key.module';

@Module({
    imports: [DbModule, ChatModule, KeyModule, forwardRef(() => ContactModule), ApiModule],
    controllers: [MessageController],
    providers: [MessageService],
    exports: [MessageService],
})
export class MessageModule {}
