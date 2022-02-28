import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ApiService {
    constructor(private readonly _configService: ConfigService) {}

    /**
     * Registers a digital twin to the central users backend API.
     * @param {string} doubleName - Username paired with .3bot.
     * @param {string} signedAddress - Signed Yggdrasil address.
     */
    registerDigitalTwin({ doubleName, signedAddress }: { doubleName: string; signedAddress: string }) {
        return axios.put(`${this._configService.get<string>('appBackend')}/api/users/digitaltwin/${doubleName}`, {
            app_id: this._configService.get<string>('appId'),
            signed_yggdrasil_ip_address: signedAddress,
        });
    }
}
