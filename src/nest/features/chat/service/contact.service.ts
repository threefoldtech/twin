import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { CreateContactDTO } from '../dtos/contact.dto';
import { Contact, contactSchema } from '../models/contact.model';

@Injectable()
export class ContactService {
    private _contactRepo: Repository<Contact>;

    constructor(private readonly _dbService: DbService) {
        this._contactRepo = this._dbService.createRepository(contactSchema);
    }

    /**
     * Gets contacts using pagination.
     * @param offset - Contact offset, defaults to 0.
     * @param count - Amount of contacts to fetch, defaults to 25.
     * @return {Contact[]} - Found contacts.
     */
    async getContacts({ offset = 0, count = 25 }: { offset?: number; count?: number } = {}): Promise<Contact[]> {
        try {
            return await this._contactRepo.search().return.page(offset, count);
        } catch {
            throw new NotFoundException('no contacts found');
        }
    }

    /**
     * Creates a new contact.
     * @param {string} id - Contact ID.
     * @param {string} location - Contact IPv6.
     * @return {Contact} - Created entity.
     */
    async createContact({ id, location }: CreateContactDTO): Promise<Contact> {
        try {
            return await this._contactRepo.createAndSave({
                id,
                location,
            });
        } catch (error) {
            throw new BadRequestException(`unable to create contact: ${error}`);
        }
    }
}
