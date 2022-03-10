import { IsString } from 'class-validator';

import { CreateMessageDTO } from './message.dto';

export class CreateContactDTO {
    @IsString()
    id: string;

    @IsString()
    location: string;

    message?: CreateMessageDTO;
}
