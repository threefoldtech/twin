import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../../guards/auth.guard';
import { CreateContactDTO } from '../dtos/contact.dto';
import { Contact } from '../models/contact.model';
import { ContactService } from '../service/contact.service';

@Controller('contacts')
export class ContactController {
    constructor(private readonly _contactService: ContactService) {}

    @Get()
    @UseGuards(AuthGuard)
    async getContacts(@Query('offset') offset = 0, @Query('count') count = 25): Promise<Contact[]> {
        return await this._contactService.getContacts({ offset, count });
    }

    @Post()
    @UseGuards(AuthGuard)
    async createContact(@Body() { id, location, message }: CreateContactDTO): Promise<Contact> {
        return await this._contactService.createNewContact({
            id,
            location,
            message,
        });
    }
}
