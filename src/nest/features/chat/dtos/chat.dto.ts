import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateChatDTO {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsArray()
    contacts: string[];

    @IsNotEmpty()
    @IsArray()
    messages: string[];

    @IsNotEmpty()
    @IsBoolean()
    acceptedChat: boolean;

    @IsNotEmpty()
    @IsString()
    adminId: string;

    read: string[] = [];

    isGroup = false;

    draft?: string[] = [];
}
