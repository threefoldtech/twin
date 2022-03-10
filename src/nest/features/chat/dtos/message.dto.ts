import { IsNotEmpty, IsString } from 'class-validator';

import { Message, MessageBody, MessageType } from '../models/message.model';

export class CreateMessageDTO {
    @IsString()
    chatId: string;

    @IsString()
    from: string;

    @IsString()
    to: string;

    @IsNotEmpty()
    body: MessageBody;

    @IsNotEmpty()
    timestamp: Date;

    @IsNotEmpty()
    type: MessageType;

    subject: string;

    signatures: string[];

    replies: Message[];
}
