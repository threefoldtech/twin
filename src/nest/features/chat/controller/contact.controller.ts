import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../../guards/auth.guard';
import { CreateContactDTO } from '../dtos/contact.dto';
import { ContactService } from '../service/contact.service';

@Controller()
export class ContactController {
    constructor(private readonly _contactService: ContactService) {}

    @Post()
    @UseGuards(AuthGuard)
    async createContact(@Body() createContactDTO: CreateContactDTO) {
        return await this._contactService.createContact({
            id: createContactDTO.id,
            location: createContactDTO.location,
        });
    }
}
