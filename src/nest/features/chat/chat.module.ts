import { Module } from '@nestjs/common';

import { ChatController } from './controller/chat.controller';
import { ChatService } from './service/chat.service';

@Module({
    controllers: [ChatController],
    providers: [ChatService],
    exports: [ChatService],
})
export class ChatModule {}
