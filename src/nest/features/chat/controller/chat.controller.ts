import { Controller, Get, Post, Query } from '@nestjs/common';

import { Chat } from '../models/chat.model';
import { ChatService } from '../service/chat.service';

@Controller('chats')
export class ChatController {
    constructor(private readonly _chatService: ChatService) {}

    @Post()
    async createChat() {
        // TODO: get data from body request
        const createdChat = await this._chatService.createChat({
            name: 'test',
            contacts: ['edward', 'jens'],
            messages: [
                '{"chatId": "testchat", "from": "edward", "to": "jens", "body": "Test message", "timestamp": "2022-03-02", "type": "MESSAGE", "subject": "Subject", "signatures": "", "replies": ""}',
            ],
            acceptedChat: true,
            adminId: 'edward',
            read: ['edward'],
            isGroup: false,
            draft: [],
        });

        return {
            entityData: {
                ...createdChat,
                messages: createdChat.parseMessages(),
            },
        };
    }

    @Get()
    async getAcceptedChats(@Query('offset') offset = 0, @Query('count') count = 25): Promise<Chat[]> {
        return await this._chatService.getAcceptedChats(offset, count);
    }
}
