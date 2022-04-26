import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../guards/auth.guard';
import { Contact } from '../contact/models/contact.model';
import { Message } from '../message/models/message.model';
import { ChatService } from './chat.service';
import { CreateChatDTO } from './dtos/chat.dto';
import { Chat } from './models/chat.model';

@Controller('chats')
export class ChatController {
    constructor(private readonly _chatService: ChatService) {}

    @Post()
    @UseGuards(AuthGuard)
    async createChat(
        @Body() createChatDTO: CreateChatDTO
    ): Promise<{ messages: Message[]; contacts: Contact[]; draft: Message[]; id: string }> {
        const createdChat = await this._chatService.createChat({
            chatId: createChatDTO.chatId,
            name: createChatDTO.name,
            contacts: createChatDTO.contacts,
            messages: createChatDTO.messages,
            acceptedChat: createChatDTO.acceptedChat,
            adminId: createChatDTO.adminId,
            read: createChatDTO.read,
            isGroup: createChatDTO.isGroup,
            draft: createChatDTO.draft,
        });

        return {
            id: createdChat.entityId,
            ...createdChat.entityData,
            messages: createdChat.parseMessages(),
            contacts: createdChat.parseContacts(),
            draft: createdChat.parseMessages(true),
        };
    }

    @Get()
    async getAcceptedChats(@Query('offset') offset = 0, @Query('count') count = 50): Promise<Chat[]> {
        return await this._chatService.getChats({ offset, count });
    }
}
