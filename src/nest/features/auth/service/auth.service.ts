import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateRandomString, ThreefoldLogin } from '@threefoldjimber/threefold_login/dist';

@Injectable()
export class AuthService {
    constructor(private readonly _configService: ConfigService) {}

    async getAppLoginUrl(redirectUrl: string): Promise<{ loginState: string; loginUrl: string }> {
        const login = new ThreefoldLogin(
            this._configService.get<string>('appBackend'),
            this._configService.get<string>('appId'),
            this._configService.get<string>('seedPhrase'),
            redirectUrl,
            this._configService.get<string>('kycBackend')
        );
        await login.init();
        const loginState = generateRandomString();
        return {
            loginState,
            loginUrl: login.generateLoginUrl(loginState, {
                scope: '{"email": true, "derivedSeed": true, "digitalTwin": true}',
            }),
        };
    }
}
