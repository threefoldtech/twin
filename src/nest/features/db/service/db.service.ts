import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'redis-om';

@Injectable()
export class DbService {
    client: Client;

    constructor(private readonly _configService: ConfigService) {
        this.client = new Client();
    }

    async connect() {
        if (!this.client.isOpen()) {
            await this.client.open(this._configService.get<string>('REDIS_URL'));
        }
    }
}
