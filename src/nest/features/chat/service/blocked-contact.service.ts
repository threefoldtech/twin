import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { CreateBlockedContactDTO, DeleteBlockedContactDTO } from '../dtos/blocked-contact.dto';
import { BlockedContact, blockedContactSchema } from '../models/blocked-contact.model';
import { ContactService } from './contact.service';

@Injectable()
export class BlockedContactService {
    private _blockedContactRepo: Repository<BlockedContact>;

    constructor(private readonly _dbService: DbService, private readonly _contactService: ContactService) {
        this._blockedContactRepo = this._dbService.createRepository(blockedContactSchema);
    }

    /**
     * Adds a contact to blocked list and removes it from contacts.
     * @param {string} id - Contact ID.
     * @param {string} location - Contact IPv6.
     * @param {Date} since - Date when the contact was added to blocked list.
     * @return {BlockedContact} - Created entity.
     */
    async addBlockedContact({ id, location, since }: CreateBlockedContactDTO): Promise<BlockedContact> {
        try {
            this._contactService.deleteContact({ id });
            return await this._blockedContactRepo.createAndSave({
                id,
                location,
                since,
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
            this._contactService.addContact({ id, location: contact.location, contactRequest: false });
            return await this._blockedContactRepo.remove(contact.entityId);
        } catch (error) {
            throw new BadRequestException(`unable to remove contact from blocked list: ${error}`);
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
