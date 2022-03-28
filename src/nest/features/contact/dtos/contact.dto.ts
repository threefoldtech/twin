import { IsBoolean, IsString } from 'class-validator';

import { Message } from '../message/models/message.model';

export class ContactDTO {
    @IsString()
    id: string;

    @IsString()
    location: string;
}

export class CreateContactDTO {
    @IsString()
    id: string;

    @IsString()
    location: string;

    @IsBoolean()
    contactRequest: boolean;

    message?: Message;
}

export class DeleteContactDTO {
    @IsString()
    id: string;
}
