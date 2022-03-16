import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { CreateBlockedContactDTO, DeleteBlockedContactDTO } from '../dtos/blocked-contact.dto';
import { BlockedContact, blockedContactSchema } from '../models/blocked-contact.model';

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
     * @param {string} location - Contact IPv6.
     * @param {Date} since - Date when the contact was added to blocked list.
     * @return {BlockedContact} - Created entity.
     */
    async addBlockedContact({ id }: CreateBlockedContactDTO): Promise<BlockedContact> {
        try {
            return await this._blockedContactRepo.createAndSave({
                id,
            });
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
     * @return {BlockedContact[]} - Found blocked contacts.
     */
    async getBlockedContactList(): Promise<BlockedContact[]> {
        try {
            return await this._blockedContactRepo.search().return.all();
        } catch (error) {
            console.log(error);
            return [];
        }
    }
}
