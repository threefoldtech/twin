import { Injectable } from '@nestjs/common';

import { LocationResponse } from '../models/responses';

@Injectable()
export class LocationService {
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
