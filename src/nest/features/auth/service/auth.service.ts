import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateRandomString, ThreefoldLogin } from '@threefoldjimber/threefold_login/dist';
import { decodeBase64 } from 'tweetnacl-util';

import { EncryptionService } from '../../encryption/service/encryption.service';
import { KeyType } from '../../store/models/key.model';
import { KeyService } from '../../store/service/keys.service';

@Injectable()
export class AuthService {
    tfLogin: ThreefoldLogin;

    constructor(
        private readonly _configService: ConfigService,
        private readonly _keyService: KeyService,
        private readonly _encryptionService: EncryptionService
    ) {}

    /**
     * Generates threefold app login url.
     * @param {string} redirectUrl - Redirection Url.
     * @return {loginState: string, loginUrl: string} - The generated loginState and Url.
     */
    async getAppLogin(redirectUrl?: string): Promise<{ loginState: string; loginUrl: string }> {
        try {
            this.tfLogin = new ThreefoldLogin(
                this._configService.get<string>('appBackend'),
                this._configService.get<string>('appId'),
                this._configService.get<string>('seedPhrase'),
                redirectUrl ?? '',
                this._configService.get<string>('kycBackend')
            );
            await this.tfLogin.init();
            const loginState = generateRandomString();
            return {
                loginState,
                loginUrl: this.tfLogin.generateLoginUrl(loginState, {
                    scope: '{"email": true, "derivedSeed": true, "digitalTwin": true}',
                }),
            };
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    /**
     * Gets users profile data
     * @param {URL} redirectUrl - Redirection Url.
     * @param {string} sessionState - Current session state.
     */
    async getProfileData({ redirectUrl, sessionState }: { redirectUrl: URL; sessionState: string }): Promise<void> {
        try {
            const profileData = (await this.tfLogin.parseAndValidateRedirectUrl(redirectUrl, sessionState))?.profile;

            const doubleName: string = <string>profileData.doubleName;
            const derivedSeed: string = <string>profileData.derivedSeed;
            const userId = doubleName.replace('.3bot', '');

            if (userId !== this._configService.get<string>('userId') || !derivedSeed)
                throw new UnauthorizedException('no user id or derived seed found');

            const seed = new Uint8Array(decodeBase64(derivedSeed));
            const keyPair = this._encryptionService.getKeyPair(seed);
            if (!keyPair) throw new UnauthorizedException('invalid key pair');

            try {
                this._keyService.updateKey(keyPair.publicKey, KeyType.Public);
                this._keyService.updateKey(keyPair.secretKey, KeyType.Secret);
            } catch (error) {
                throw new UnauthorizedException(error);
            }
        } catch (error) {
            throw new UnauthorizedException(error);
        }
    }
}
