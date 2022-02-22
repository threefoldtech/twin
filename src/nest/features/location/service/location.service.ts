import { Injectable } from '@nestjs/common';

import { LocationResponse } from '../service/location.service';

export class LocationService {
    constructor(private readonly _locationService) {}

    getLocations(): LocationResponse {
        return {
            data: [
                {
                    id: 1,
                    location: 'localhost',
                },
                {
                    id: 2,
                    location: 'localhost',
                },
            ],
        };
    }
}
