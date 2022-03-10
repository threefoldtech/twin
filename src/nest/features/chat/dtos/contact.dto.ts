import { IsString } from 'class-validator';

export class CreateContactDTO {
    @IsString()
    id: string;

    @IsString()
    location: string;
}
