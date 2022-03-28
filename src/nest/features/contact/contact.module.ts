import { Module } from '@nestjs/common';

import { ContactController } from '../chat/controller/contact.controller';
import { ContactService } from '../chat/service/contact.service';

@Module({
    controllers: [ContactController],
    providers: [ContactService],
})
export class ContactModule {}
