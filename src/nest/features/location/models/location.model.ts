import { FieldInitializer } from '../../../utils/field-initializer';

// Model
export class Location extends FieldInitializer<Location> {
    id: number;
    location: string;
}

// Responses
export class LocationResponse {
    data: Location[];
}

// Requests
