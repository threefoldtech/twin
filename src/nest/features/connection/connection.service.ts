import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../db/db.service';
import { Connection, connectionSchema } from './models/connection.model';

@Injectable()
export class ConnectionService {
    private _connectionRepo: Repository<Connection>;

    constructor(private readonly _dbService: DbService) {
        this._connectionRepo = this._dbService.createRepository(connectionSchema);
        this._connectionRepo.createIndex();
    }

    /**
     * Adds a twin connection to Redis.
     * @param {string} connection - IPv6 to add.
     * @return {Connection} - Created entity.
     */
    async addConnection(connection: string): Promise<Connection> {
        try {
            return this._connectionRepo.createAndSave({ connection });
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    /**
     * Removes a twin connection from Redis.
     * @param {string} ID - Twin ID to remove.
     */
    async removeConnection(ID: string): Promise<void> {
        try {
            return await this._connectionRepo.remove(ID);
        } catch (error) {
            throw new NotFoundException(error);
        }
    }

    /**
     * Gets all connections stored in Redis.
     * @param offset - Chat offset, defaults to 0.
     * @param count - Amount of chats to fetch, defaults to 25.
     * @return {Connection[]} - The connection list.
     */
    async getConnections({ offset = 0, count = 25 }: { offset?: number; count?: number } = {}): Promise<Connection[]> {
        try {
            return await this._connectionRepo.search().return.page(offset, count);
        } catch (error) {
            throw new InternalServerErrorException(`something went wrong getting connections: ${error}`);
        }
    }
}
