import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Location } from '../../location/models/location.model';

@Injectable()
export class ChatService {
    constructor(private readonly _configService: ConfigService) {}

    createChat(chatId: string, contacts: Location[]) {
        throw new NotImplementedException();
    }

    saveMessage(chatId: string, message: string) {
        throw new NotImplementedException();
    }
}
