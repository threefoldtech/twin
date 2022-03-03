import { IsNotEmpty, IsString } from 'class-validator';

import { Message, MessageType } from '../models/message.model';

export class CreateMessageDTO {
    @IsString()
    chatId: string;

    @IsString()
    from: string;

    @IsString()
    to: string;

    @IsNotEmpty()
    body: string;

    @IsNotEmpty()
    timestamp: Date;

    @IsNotEmpty()
    type: MessageType;

    subject: string;

    signatures: string[];

    replies: Message[];
}
