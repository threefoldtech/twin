import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Entity, Repository, Schema } from 'redis-om';

@Injectable()
export class DbService {
    private client: Client;

    constructor(private readonly _configService: ConfigService) {
        this.client = new Client();
    }

    /**
     * Connects redis-om client to Redis.
     */
    async connect(): Promise<void> {
        if (!this.client.isOpen()) {
            await this.client.open(this._configService.get<string>('REDIS_URL'));
        }
    }

    /**
     * Creates a repository for given schema.
     * @param {Schema>} schema - Schema to make a repository from.
     * @return {Repository} - The created repository.
     */
    createRepository<T extends Entity>(schema: Schema<T>): Repository<T> {
        return new Repository(schema, this.client);
    }

    /**
     * Creates indexes based on the repository's schema
     * @param {Repository} repo - The repository to make indexes on
     */
    async createIndex<T extends Entity>(repo: Repository<T>): Promise<void> {
        await this.connect();
        await repo.createIndex();
    }
}
