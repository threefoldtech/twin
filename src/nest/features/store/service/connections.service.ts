import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { Connection, connectionSchema } from '../models/connection.model';

@Injectable()
export class ConnectionService {
    private connectionRepo: Repository<Connection>;

    constructor(private readonly _dbService: DbService) {
        this.connectionRepo = _dbService.createRepository(connectionSchema);
        this._dbService.createIndex(this.connectionRepo);
    }

    /**
     */
    async addConnection(connection: string): Promise<string> {
        try {
            const connectionEntity = this.connectionRepo.createEntity({ connection });
            return await this.connectionRepo.save(connectionEntity);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }
}
