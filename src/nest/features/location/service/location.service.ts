import { Injectable } from '@nestjs/common';

import { LocationResponse } from '../models/location.model';

@Injectable()
export class LocationService {
    /**
     * Gets locations.
     * @return {LocationResponse} The locations.
     */
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
