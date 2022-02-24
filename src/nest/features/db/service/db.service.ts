import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Entity, Repository, Schema } from 'redis-om';

@Injectable()
export class DbService {
    private client: Client;

    constructor(private readonly _configService: ConfigService) {
        this.client = new Client();
    }

    async connect() {
        if (!this.client.isOpen()) {
            await this.client.open(this._configService.get<string>('REDIS_URL'));
        }
    }

    createRepository<T extends Entity>(schema: Schema<T>) {
        return new Repository(schema, this.client);
    }

    async createIndex<T extends Entity>(repo: Repository<T>) {
        await this.connect();
        await repo.createIndex();
    }
}
