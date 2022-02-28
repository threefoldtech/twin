import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { exec } from 'child_process';

import { EncryptionService } from '../../encryption/service/encryption.service';
import { LocationResponse } from '../types/responses';

@Injectable()
export class LocationService {
    constructor(
        private readonly _configService: ConfigService,
        private readonly _encryptionService: EncryptionService
    ) {}

    /**
     * Gets locations.
     * @return {LocationResponse} - The locations.
     */
    getLocations(): LocationResponse {
        return {
            data: [
                {
                    id: 1,
                    location: 'localhost',
                },
                {
                    id: 2,
                    location: 'localhost',
                },
            ],
        };
    }

    /**
     * Gets current location (IPv6) of own connection.
     * @return {string} - Own address.
     * @return {Error} - Error.
     */
    getOwnLocation(): Promise<string | Error> {
        return new Promise((res, rej) => {
            exec(
                "yggdrasilctl -v getSelf | sed -n -e 's/^.*IPv^ address.* //p'",
                (err: Error, stdout: string, sterr: string) => {
                    if (err) return rej(err);
                    if (sterr) return rej(sterr);
                    const address = stdout.replace(/(\r\n|\n|\r)/gm, '').trim();
                    res(address);
                }
            );
        });
    }

    /**
     * Registers a digital twin to the central users backend API.
     * @param {string} doubleName - Username paired with .3bot.
     * @param {string} derivedSeed - The derived seed.
     * @param {string} yggdrasilAddress - Unsigned Yggdrasil address.
     */
    async registerDigitalTwin({
        doubleName,
        derivedSeed,
        yggdrasilAddress,
    }: {
        doubleName: string;
        derivedSeed: string;
        yggdrasilAddress: string;
    }): Promise<void> {
        const seed = this._encryptionService.decodeSeed(derivedSeed);
        const keyPair = this._encryptionService.getKeyPair(seed);
        const data = this._encryptionService.decodeAddress(yggdrasilAddress);
        const signedAddress = this._encryptionService.signAddress(data, keyPair.secretKey);
        await axios.put(`${this._configService.get<string>('appBackend')}/api/users/digitaltwin/${doubleName}`, {
            app_id: this._configService.get<string>('appId'),
            signed_yggdrasil_ip_address: signedAddress,
        });
    }
}
