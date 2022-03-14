import { IsString } from 'class-validator';

import { Message } from '../models/message.model';

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

    message?: Message;
}

export class DeleteContactDTO {
    @IsString()
    id: string;
}
