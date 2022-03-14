import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'redis-om';

import { ApiService } from '../../api/service/api.service';
import { Contact } from '../../chat/models/contact.model';
import { Message } from '../../chat/models/message.model';
import { DbService } from '../../db/service/db.service';
import { EncryptionService } from '../../encryption/service/encryption.service';
import { Key, keySchema, KeyType } from '../models/key.model';

@Injectable()
export class KeyService {
    private _keyRepo: Repository<Key>;

    constructor(
        private readonly _configService: ConfigService,
        private readonly _dbService: DbService,
        private readonly _encryptionService: EncryptionService,
        private readonly _apiService: ApiService
    ) {
        this._keyRepo = this._dbService.createRepository(keySchema);
    }

    /**
     * Updates either private or public key based on the key type.
     * @param {Uint8Array} pk - Private/Public key in Uint8Array format.
     * @param {KeyType} keyType - Identifies a key as public or private.
     * @return {Key} - Created entity.
     */
    async updateKey({ pk, keyType }: { pk: Uint8Array; keyType: KeyType }): Promise<Key> {
        const pkString = this._encryptionService.uint8ToBase64(pk);
        const userID = this._configService.get<string>('userId');
        try {
            // TODO: update if exists
            return this._keyRepo.createAndSave({
                userID,
                key: pkString,
                keyType,
            });
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    /**
     * Adds an external contacts public key to cache.
     * @param {Uint8Array} pk - Private/Public key in Uint8Array format.
     * @param {string} userID - Contact ID.
     * @return {Key} - Created Key entity.
     */
    async addContactPublicKey({ key, userID }: { key: string; userID: string }): Promise<Key> {
        try {
            return this._keyRepo.createAndSave({
                userID,
                key,
                keyType: KeyType.Public,
            });
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    /**
     * Gets the public or private key of logged in user.
     * @return {Key} - Public or private key.
     */
    async getKey(keyType: KeyType): Promise<Key> {
        const userId = this._configService.get<string>('userId');
        try {
            return this._keyRepo.search().where('userId').equals(userId).and('keyType').equals(keyType).return.first();
        } catch (error) {
            throw new NotFoundException(error);
        }
    }

    /**
     * Gets the public key from user by given ID.
     * @return {Key} - Public key.
     */
    async getPublicKeyByUserID(userID: string): Promise<Key> {
        try {
            return this._keyRepo
                .search()
                .where('userId')
                .equals(userID)
                .and('keyType')
                .equals(KeyType.Public)
                .return.first();
        } catch (error) {
            throw new NotFoundException(error);
        }
    }

    /**
     * Adds a signed base64 signature to the message.
     * @param {Message} message - Message to add signature to.
     */
    async appendSignatureToMessage(message: Message): Promise<Message> {
        const { key } = await this.getKey(KeyType.Private);
        if (!key) return;
        const signature = this._encryptionService.createBase64Signature({ data: message, secretKey: key });
        message.signatures.unshift(signature);
        return message;
    }

    /**
     * Verifies a message's signature.
     * @param {Contact} contact - Contact to get public key from.
     * @param {Message} message - Message with signature.
     * @param {string} signature - Signature to verify.
     * @return {boolean} - Message signature is valid or not.
     */
    async verifyMessageSignature({
        contact,
        message,
        signature,
    }: {
        contact: Contact;
        message: Message;
        signature: string;
    }): Promise<boolean> {
        const signatureIdx = message.signatures.findIndex(s => s === signature);
        if (!signatureIdx) return false;

        let { key } = await this.getPublicKeyByUserID(contact.id);
        if (!key) {
            const base64key = await this._apiService.getContactPublicKey(contact.location);
            if (!base64key) return false;
            key = base64key;
            await this.addContactPublicKey({ key, userID: contact.id });
        }

        const messageWithoutSignature = {
            ...message,
            signatures: message.signatures.slice(signatureIdx + 1, message.signatures.length),
        } as Message;

        return this._encryptionService.verifySignature({
            data: messageWithoutSignature,
            signature,
            publicKey: key,
        });
    }
}
