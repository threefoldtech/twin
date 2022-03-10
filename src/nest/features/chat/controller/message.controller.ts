import { Body, Controller, Put } from '@nestjs/common';

import { Message } from '../models/message.model';

@Controller('messages')
export class MessageController {
    @Put()
    async handleIncomingMessage(@Body() message: Message) {
        // TODO: Continue here
    }
}
