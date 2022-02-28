import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { Connection, connectionSchema } from '../models/connection.model';

@Injectable()
export class ConnectionService {
    private connectionRepo: Repository<Connection>;

    constructor(private readonly _dbService: DbService) {
        this.connectionRepo = this._dbService.createRepository(connectionSchema);
        // this._dbService.createIndex(this.connectionRepo);
    }

    /**
     * Adds a twin connection to Redis.
     * @param {string} connection - IPv6 to add.
     * @return {string} - Entity ID.
     */
    async addConnection(connection: string): Promise<string> {
        try {
            const connectionEntity = this.connectionRepo.createEntity({ connection });
            return await this.connectionRepo.save(connectionEntity);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    /**
     * Gets all connections stored in Redis.
     * @param {number} pageSize - Amount of items to return, defaults to 20.
     * @return {Connection[]} - The connection list.
     */
    async getConnections(pageSize = 20): Promise<Connection[]> {
        try {
            return await this.connectionRepo.search().returnAll({ pageSize });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
