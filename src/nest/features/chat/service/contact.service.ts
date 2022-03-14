import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'redis-om';

import { uuidv4 } from '../../../utils/uuid';
import { ApiService } from '../../api/service/api.service';
import { DbService } from '../../db/service/db.service';
import { KeyService } from '../../key/service/key.service';
import { LocationService } from '../../location/service/location.service';
import { CreateContactDTO, DeleteContactDTO } from '../dtos/contact.dto';
import { CreateMessageDTO } from '../dtos/message.dto';
import { ChatGateway } from '../gateway/chat.gateway';
import { Contact, contactSchema } from '../models/contact.model';
import { ContactRequest, Message, MessageBody, MessageType } from '../models/message.model';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';

@Injectable()
export class ContactService {
    private _contactRepo: Repository<Contact>;

    constructor(
        private readonly _dbService: DbService,
        private readonly _chatService: ChatService,
        private readonly _messageService: MessageService,
        private readonly _locationService: LocationService,
        private readonly _configService: ConfigService,
        private readonly _keyService: KeyService,
        private readonly _apiService: ApiService,
        private readonly _chatGateway: ChatGateway
    ) {
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
     * @param {CreateMessageDTO} message - Contact request message.
     * @return {Contact} - Created entity.
     */
    async createNewContact({ id, location, message }: CreateContactDTO<MessageBody>): Promise<Contact> {
        const yggdrasilAddress = await this._locationService.getOwnLocation();
        // createEntity without saving to Redis
        const me = this._contactRepo.createEntity({
            id: this._configService.get<string>('userId'),
            location: yggdrasilAddress as string,
        });

        const newMessage = await this._messageService.createMessage(message);

        let newContact;
        try {
            newContact = await this._contactRepo.createAndSave({
                id,
                location,
            });
        } catch (error) {
            throw new BadRequestException(`unable to create contact: ${error}`);
        }

        const signedMessage = await this._keyService.appendSignatureToMessage(newMessage);
        const chat = this._chatService.createChat({
            chatId: newContact.id,
            name: newMessage.to,
            contacts: [newContact, me],
            messages: [signedMessage],
            acceptedChat: true,
            adminId: me.id,
            read: [],
            isGroup: false,
            draft: [],
        });

        const contactRequest: CreateMessageDTO<ContactRequest> = {
            id: uuidv4(),
            from: newMessage.from,
            to: newContact.id,
            body: {
                id: newContact.id,
                location: yggdrasilAddress as string,
            },
            timeStamp: new Date(),
            type: MessageType.CONTACT_REQUEST,
            subject: null,
            signatures: [],
            replies: [],
        };
        const signedContactRequest = await this._keyService.appendSignatureToMessage(
            contactRequest as unknown as Message
        );

        await this._apiService.sendMessageToApi({ location: newContact.location, message: signedContactRequest });

        this._chatGateway.emitMessageToConnectedClients('connection_request', chat);

        return newContact;
    }

    /**
     * Adds an existing contact.
     * @param {string} id - Contact ID.
     * @param {string} location - Contact IPv6.
     * @return {Contact} - Contact entity.
     */
    async addContact({ id, location }: CreateContactDTO<MessageBody>): Promise<Contact> {
        try {
            return await this._contactRepo.createAndSave({
                id,
                location,
            });
        } catch (error) {
            throw new BadRequestException(`unable to add contact: ${error}`);
        }
    }

    /**
     * Deletes a contact.
     * @param {string} id - Contact ID.
     */
    async deleteContact({ id }: DeleteContactDTO): Promise<void> {
        try {
            const contact = await this._contactRepo.search().where('id').eq(id).return.first();
            return await this._contactRepo.remove(contact.entityId);
        } catch (error) {
            throw new BadRequestException(`unable remove contact: ${error}`);
        }
    }
}
