import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../../guards/auth.guard';
import { CreateChatDTO } from '../dtos/chat.dto';
import { Chat } from '../models/chat.model';
import { ChatService } from '../service/chat.service';

@Controller('chats')
export class ChatController {
    constructor(private readonly _chatService: ChatService) {}

    @Post()
    @UseGuards(AuthGuard)
    async createChat(@Body() createChatDTO: CreateChatDTO) {
        // IMPORTANT: Incoming body data will need to be parsed like this or it will not be able
        // to be stored in Redis.
        // EXAMPLE
        // name: 'test',
        // contacts: ['{"id": "1", "location": "localhost"}', '{"id": "2", "location": "localhost"}'],
        // messages: [
        //     '{"chatId": "testchat", "from": "edward", "to": "jens", "body": "Test message", "timestamp": "2022-03-02", "type": "MESSAGE", "subject": "Subject", "signatures": ["edward"], "replies": []}',
        // ],
        // acceptedChat: true,
        // adminId: 'edward',
        // read: ['edward'],
        // isGroup: false,
        // draft: [],
        const createdChat = await this._chatService.createChat({
            name: createChatDTO.name,
            contacts: createChatDTO.contacts,
            messages: createChatDTO.messages,
            acceptedChat: createChatDTO.acceptedChat,
            adminId: createChatDTO.adminId,
            read: createChatDTO.read,
            isGroup: createChatDTO.isGroup,
            draft: createChatDTO.draft,
        });

        // TODO: send new chat event to socket.io
        // TODO: create socket.io service and connection with NestJS app
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
