import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../db/db.service';
import { CreateBlockedContactDTO, DeleteBlockedContactDTO } from './dtos/blocked-contact.dto';
import { BlockedContact, blockedContactSchema } from './models/blocked-contact.model';

@Injectable()
export class BlockedContactService {
    private _blockedContactRepo: Repository<BlockedContact>;

    constructor(private readonly _dbService: DbService) {
        this._blockedContactRepo = this._dbService.createRepository(blockedContactSchema);
        this._blockedContactRepo.createIndex();
    }

    /**
     * Adds a contact to blocked list and removes it from contacts.
     * @param {string} id - Contact ID.
     * @return {stirng} - Blocked contact id.
     */
    async addBlockedContact({ id }: CreateBlockedContactDTO): Promise<string> {
        try {
            const contact = await this._blockedContactRepo.createAndSave({
                id,
            });
            return contact.id;
        } catch (error) {
            throw new BadRequestException(`unable to add contact to blocked list: ${error}`);
        }
    }

    /**
     * Deletes a contact from blocked list and adds it to contacts.
     * @param {string} id - Contact ID.
     */
    async deleteBlockedContact({ id }: DeleteBlockedContactDTO): Promise<void> {
        try {
            const contact = await this._blockedContactRepo.search().where('id').eq(id).return.first();
            return await this._blockedContactRepo.remove(contact.entityId);
        } catch (error) {
            throw new BadRequestException(`unable to remove contact from blocked list: ${error}`);
        }
    }

    /**
     * Gets blocked contacts using pagination.
     * @return {string[]} - Found blocked contacts ids.
     */
    async getBlockedContactList(): Promise<string[]> {
        try {
            const contacts = await this._blockedContactRepo.search().return.all();
            return contacts.map(c => c.id);
        } catch (error) {
            console.log(error);
            return [];
        }
    }
}
