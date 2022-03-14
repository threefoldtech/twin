import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { KeyService } from '../../key/service/key.service';
import { ContactDTO } from '../dtos/contact.dto';
import { CreateMessageDTO, MessageDTO } from '../dtos/message.dto';
import { Contact } from '../models/contact.model';
import { Message, MessageBody, messageSchema, stringifyMessageBody, stringifyReplies } from '../models/message.model';

@Injectable()
export class MessageService {
    private _messageRepo: Repository<Message>;

    constructor(
        private readonly _dbService: DbService,
        private readonly _configService: ConfigService,
        private readonly _keyService: KeyService
    ) {
        this._messageRepo = this._dbService.createRepository(messageSchema);
    }

    /**
     * Creates a new message.
     * @param {string} id - Contact ID.
     * @param {string} location - Contact IPv6.
     * @return {Contact} - Created entity.
     */
    async createMessage({
        id,
        from,
        to,
        body,
        timeStamp,
        replies,
        subject,
        type,
        signatures,
    }: CreateMessageDTO<MessageBody>): Promise<Message> {
        try {
            return await this._messageRepo.createAndSave({
                id,
                from,
                to,
                body: stringifyMessageBody(body),
                timeStamp,
                replies: stringifyReplies(replies),
                subject,
                type,
                signatures,
            });
        } catch (error) {
            throw new BadRequestException(`unable to create message: ${error}`);
        }
    }

    /**
     * Verifies a message's signature.
     * @param {boolean} isGroup - Is group chat or not.
     * @param {Contact} admin - Admin contact.
     * @param {Contact} from - From contact.
     * @param {Message} signedMessage - Signed message to verify.
     * @return {boolean} - Valid signature or not.
     */
    async verifySignedMessage<T>({
        isGroup,
        adminContact,
        fromContact,
        signedMessage,
    }: {
        isGroup: boolean;
        adminContact?: ContactDTO;
        fromContact?: ContactDTO;
        signedMessage: MessageDTO<T>;
    }): Promise<boolean> {
        let signatureIdx = 0;

        const userID = this._configService.get<string>('userId');
        if (isGroup && adminContact?.id !== userID) {
            const adminVerified = await this._keyService.verifyMessageSignature({
                contact: adminContact,
                message: signedMessage,
                signature: signedMessage.signatures[signatureIdx],
            });
            if (!adminVerified) return false;
            signatureIdx++;
        }

        if (!fromContact) return false;

        return await this._keyService.verifyMessageSignature({
            contact: fromContact,
            message: signedMessage,
            signature: signedMessage.signatures[signatureIdx],
        });
    }
}
