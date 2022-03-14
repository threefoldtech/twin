import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { CreateBlockedContactDTO, DeleteBlockedContactDTO } from '../dtos/blocked-contact.dto';
import { BlockedContact, blockedContactSchema } from '../models/blocked-contact.model';

@Injectable()
export class BlockedContactService {
    private _blockedContactRepo: Repository<BlockedContact>;

    constructor(private readonly _dbService: DbService) {
        this._blockedContactRepo = this._dbService.createRepository(blockedContactSchema);
    }

    /**
     * Adds a contact to blocked list.
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
     * Adds a contact to blocked list.
     * @param {string} id - Contact ID.
     * @param {string} location - Contact IPv6.
     * @param {Date} since - Date when the contact was added to blocked list.
     */
    async deleteBlockedContact({ id }: DeleteBlockedContactDTO): Promise<void> {
        try {
            const contact = await this._blockedContactRepo.search().where('id').eq(id).return.first();
            return await this._blockedContactRepo.remove(contact.entityId);
        } catch (error) {
            throw new BadRequestException(`unable to add contact to blocked list: ${error}`);
        }
    }

    /**
     * Gets blocked contacts using pagination.
     * @param offset - Contact offset, defaults to 0.
     * @param count - Amount of blocked contacts to fetch, defaults to 25.
     * @return {BlockedContact[]} - Found blocked contacts.
     */
    async getBlockedContactList({
        offset = 0,
        count = 25,
    }: {
        offset?: number;
        count?: number;
    }): Promise<BlockedContact[]> {
        try {
            return await this._blockedContactRepo.search().return.page(offset, count);
        } catch (error) {
            throw new NotFoundException('no blocked contacts found');
        }
    }
}
