import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { ResponseType } from 'axios';

import { CreateMessageDTO } from '../../chat/dtos/message.dto';

@Injectable()
export class ApiService {
    constructor(private readonly _configService: ConfigService) {}

    /**
     * Registers a digital twin to the central users backend API.
     * @param {string} doubleName - Username paired with .3bot.
     * @param {string} signedAddress - Signed Yggdrasil address.
     */
    async registerDigitalTwin({ doubleName, signedAddress }: { doubleName: string; signedAddress: string }) {
        try {
            return await axios.put(
                `${this._configService.get<string>('appBackend')}/api/users/digitaltwin/${doubleName}`,
                {
                    app_id: this._configService.get<string>('appId'),
                    signed_yggdrasil_ip_address: signedAddress,
                }
            );
        } catch (error) {
            throw new BadRequestException(`unable to register digital twin to external API: ${error}`);
        }
    }

    /**
     * Sends a message to another digital twin.
     * @param {string} location - IPv6 location to send message to.
     * @param {CreateMessageDTO} message - Message to send.
     * @param {ResponseType} responseType - Axios optional response type.
     */
    async sendMessageToApi<T>({
        location,
        message,
        responseType,
    }: {
        location: string;
        message: CreateMessageDTO<T>;
        responseType?: ResponseType;
    }) {
        try {
            // TODO: change to /nest/messages when implemented
            return await axios.put(`http://[${location}/api/messages`, message, {
                responseType: responseType || 'json',
            });
        } catch (error) {
            throw new BadRequestException(`unable to send message to external API: ${error}`);
        }
    }
}
