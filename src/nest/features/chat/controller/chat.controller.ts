import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../../guards/auth.guard';
import { CreateChatDTO } from '../dtos/chat.dto';
import { Chat, stringifyContacts, stringifyMessages } from '../models/chat.model';
import { ChatService } from '../service/chat.service';

@Controller('chats')
export class ChatController {
    constructor(private readonly _chatService: ChatService) {}

    @Post()
    // @UseGuards(AuthGuard)
    async createChat(@Body() createChatDTO: CreateChatDTO) {
        const createdChat = await this._chatService.createChat({
            name: createChatDTO.name,
            contacts: stringifyContacts(createChatDTO.contacts),
            messages: stringifyMessages(createChatDTO.messages),
            acceptedChat: createChatDTO.acceptedChat,
            adminId: createChatDTO.adminId,
            read: createChatDTO.read,
            isGroup: createChatDTO.isGroup,
            draft: stringifyMessages(createChatDTO.draft),
        });

        // TODO: send new chat event to socket.io
        return {
            ...createdChat.entityData,
            messages: createdChat.parseMessages(),
            contacts: createdChat.parseContacts(),
            draft: createdChat.parseMessages(true),
        };
    }

    @Get()
    async getAcceptedChats(@Query('offset') offset = 0, @Query('count') count = 25): Promise<Chat[]> {
        return await this._chatService.getAcceptedChats({ offset, count });
    }
}
