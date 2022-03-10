import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../../guards/auth.guard';
import { CreateContactDTO } from '../dtos/contact.dto';
import { Contact } from '../models/contact.model';
import { ContactService } from '../service/contact.service';

@Controller()
export class ContactController {
    constructor(private readonly _contactService: ContactService) {}

    @Post()
    @UseGuards(AuthGuard)
    async getContacts(@Query('offset') offset = 0, @Query('count') count = 25): Promise<Contact[]> {
        return await this._contactService.getContacts({ offset, count });
    }

    @Post()
    @UseGuards(AuthGuard)
    async createContact(@Body() createContactDTO: CreateContactDTO): Promise<Contact> {
        const newContact = await this._contactService.createContact({
            id: createContactDTO.id,
            location: createContactDTO.location,
            message: createContactDTO.message,
        });

        // create message
        // get own location
        // create chat
        // send message

        return newContact;
    }
}
