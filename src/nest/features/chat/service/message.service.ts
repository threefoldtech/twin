import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { CreateMessageDTO } from '../dtos/message.dto';
import { Message, messageSchema, stringifyMessageBody, stringifyReplies } from '../models/message.model';

@Injectable()
export class MessageService {
    private _messageRepo: Repository<Message>;

    constructor(private readonly _dbService: DbService) {
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
    }: CreateMessageDTO): Promise<Message> {
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
}
