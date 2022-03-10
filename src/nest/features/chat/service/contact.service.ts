import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { Contact, contactSchema } from '../models/contact.model';

@Injectable()
export class ContactService {
    private _contactService: Repository<Contact>;

    constructor(private readonly _dbService: DbService) {
        this._contactService = this._dbService.createRepository(contactSchema);
    }

    async createContact({ id, location }: { id: string; location: string }): Promise<Contact> {
        try {
            return await this._contactService.createAndSave({
                id,
                location,
            });
        } catch (error) {
            throw new BadRequestException(`unable to create contact: ${error}`);
        }
    }
}
