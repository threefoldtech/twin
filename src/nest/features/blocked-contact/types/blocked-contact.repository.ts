import { CreateBlockedContactDTO, DeleteBlockedContactDTO } from '../dtos/blocked-contact.dto';

export interface BlockedContactRepository {
    /**
     * Gets blocked contacts using pagination.
     * @return {string[]} - Found blocked contacts ids.
     */
    getBlockedContacts(): Promise<string[]>;

    /**
     * Adds a contact to blocked list and removes it from contacts.
     * @param {Object} obj - Object.
     * @param {string} obj.id - Contact ID.
     * @return {string} - Blocked contact id.
     */
    addBlockedContact({ id }: CreateBlockedContactDTO): Promise<string>;

    /**
     * Deletes a contact from blocked list and adds it to contacts.
     * @param {Object} obj - Object.
     * @param {string} obj.id - Contact ID.
     */
    deleteBlockedContact({ id }: DeleteBlockedContactDTO): Promise<void>;
}
