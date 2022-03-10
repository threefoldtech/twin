import { Module } from '@nestjs/common';

import { ContactController } from './controller/contact.controller';
import { ContactService } from './service/contact.service';

@Module({
    controllers: [ContactController],
    providers: [ContactService],
    exports: [ContactService],
})
export class ContactModule {}
