import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../service/auth.service';

@Injectable()
export default class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly _authService: AuthService) {
        super();
    }

    // async validate(username: string): Promise<boolean> {
    //     const user = await this.authService.login({ email, password })
    //     return true
    // }
}
