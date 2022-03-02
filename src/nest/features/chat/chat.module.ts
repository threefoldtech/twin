import { Module } from '@nestjs/common';

import { DbModule } from '../db/db.module';
import { ChatController } from './controller/chat.controller';
import { ChatService } from './service/chat.service';

@Module({
    imports: [DbModule],
    controllers: [ChatController],
    providers: [ChatService],
})
export class ChatModule {}
