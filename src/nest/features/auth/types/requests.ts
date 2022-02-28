import { IsNotEmpty, IsString } from 'class-validator';

// Request interfaces
export class SignInRequest {
    @IsNotEmpty()
    @IsString()
    username: string;
}
