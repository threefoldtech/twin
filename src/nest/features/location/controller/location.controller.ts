import { Controller, Get } from '@nestjs/common';

import { LocationService } from '../service/location.service';

@Controller('locations')
export class LocationController {
    constructor(private readonly _locationService: LocationService) {}

    @Get()
    getLocations() {
        return this._locationService.getLocations();
    }
}
