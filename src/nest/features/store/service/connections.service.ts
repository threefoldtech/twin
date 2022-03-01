import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { Connection, connectionSchema } from '../models/connection.model';

@Injectable()
export class ConnectionService {
    private _connectionRepo: Repository<Connection>;

    constructor(private readonly _dbService: DbService) {
        this._connectionRepo = this._dbService.createRepository(connectionSchema);
        // this._dbService.createIndex(this.connectionRepo);
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
     * @param {number} pageSize - Amount of items to return, defaults to 20.
     * @return {Connection[]} - The connection list.
     */
    async getConnections(pageSize = 20): Promise<Connection[]> {
        try {
            return await this._connectionRepo.search().returnAll({ pageSize });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
