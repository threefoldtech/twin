import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../../guards/auth.guard';
import { CreateBlockedContactDTO, DeleteBlockedContactDTO } from '../dtos/blocked-contact.dto';
import { BlockedContact } from '../models/blocked-contact.model';
import { BlockedContactService } from '../service/blocked-contact.service';

@Controller('blocked')
export class BlockedContactController {
    constructor(private readonly _blockedContacService: BlockedContactService) {}

    @Post()
    @UseGuards(AuthGuard)
    async addBlockedContact(@Body() createBlockedContactDTO: CreateBlockedContactDTO): Promise<BlockedContact> {
        return await this._blockedContacService.addBlockedContact({
            id: createBlockedContactDTO.id,
            location: createBlockedContactDTO.location,
            since: createBlockedContactDTO.since,
        });
    }

    @Get()
    @UseGuards(AuthGuard)
    async getBlockedContacts(@Query('offset') offset = 0, @Query('count') count = 25): Promise<BlockedContact[]> {
        return await this._blockedContacService.getBlockedContactList({ offset, count });
    }

    @Delete()
    @UseGuards(AuthGuard)
    async deleteBlockedContact(@Query('id') { id }: DeleteBlockedContactDTO) {
        return await this._blockedContacService.deleteBlockedContact({ id });
    }
}
