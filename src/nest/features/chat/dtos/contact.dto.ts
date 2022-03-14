import { IsString } from 'class-validator';

import { CreateMessageDTO } from './message.dto';

export class CreateContactDTO<T> {
    @IsString()
    id: string;

    @IsString()
    location: string;

    message?: CreateMessageDTO<T>;
}

export class DeleteContactDTO {
    @IsString()
    id: string;
}
