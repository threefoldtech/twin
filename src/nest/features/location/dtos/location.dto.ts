import { FieldInitializer } from '../../../utils/field-initializer';

// DTO
export class LocationDTO extends FieldInitializer<LocationDTO> {
    id: number;
    location: string;
}

// Responses
export class LocationResponse {
    data: LocationDTO[];
}

// Requests
