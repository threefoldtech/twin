import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { CreateChatDTO } from '../dtos/chat.dto';
import { Chat } from '../models/chat.model';
import { ChatService } from '../service/chat.service';

@Controller('chats')
export class ChatController {
    constructor(private readonly _chatService: ChatService) {}

    @Post()
    async createChat(@Body() createChatDTO: CreateChatDTO) {
        // TODO: get data from body request
        // IMPORTANT: Incoming body data will need to be parsed like this or it will not be able
        // to be stored in Redis.
        const createdChat = await this._chatService.createChat({
            name: 'test',
            contacts: ['{"id": "1", "location": "localhost"}', '{"id": "2", "location": "localhost"}'],
            messages: [
                '{"chatId": "testchat", "from": "edward", "to": "jens", "body": "Test message", "timestamp": "2022-03-02", "type": "MESSAGE", "subject": "Subject", "signatures": ["edward"], "replies": [{"chatId": "testchat", "from": "jens", "to": "edward", "body": "Test reply message", "timestamp": "2022-03-02", "type": "MESSAGE", "subject": "Reply", "signatures": ["jens"], "replies": []}]}',
                '{"chatId": "testchat", "from": "jens", "to": "edward", "body": "Test reply message", "timestamp": "2022-03-02", "type": "MESSAGE", "subject": "Reply", "signatures": ["jens"], "replies": []}',
            ],
            acceptedChat: true,
            adminId: 'edward',
            read: ['edward'],
            isGroup: false,
            draft: [
                '{"chatId": "testchat", "from": "edward", "to": "jens", "body": "Test draft message", "timestamp": "2022-03-02", "type": "MESSAGE", "subject": "Draft", "signatures": ["edward"], "replies": []}',
            ],
        });

        return {
            ...createdChat.entityData,
            messages: createdChat.parseMessages(),
            contacts: createdChat.parseContacts(),
            draft: createdChat.parseMessages(true),
        };
    }

    @Get()
    async getAcceptedChats(@Query('offset') offset = 0, @Query('count') count = 25): Promise<Chat[]> {
        return await this._chatService.getAcceptedChats(offset, count);
    }
}
