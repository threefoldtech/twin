import { IsDate, IsString } from 'class-validator';

export class CreateBlockedContactDTO {
    @IsString()
    id: string;

    @IsString()
    location: string;

    @IsDate()
    since: Date;
}

export class DeleteBlockedContactDTO {
    @IsString()
    id: string;
}
