import { IsNotEmpty, IsString } from 'class-validator';

import { Message, MessageBody, MessageType } from '../models/message.model';

export class CreateMessageDTO<T> {
    @IsString()
    id: string;

    @IsString()
    from: string;

    @IsString()
    to: string;

    @IsNotEmpty()
    body: T;

    @IsNotEmpty()
    timeStamp: Date;

    @IsNotEmpty()
    type: MessageType;

    subject: string;

    signatures: string[];

    replies: Message[];
}
