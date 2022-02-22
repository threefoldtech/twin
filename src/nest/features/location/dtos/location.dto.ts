import { FieldInitializer } from '@/nest/utils/field-initializer';

export class LocationDTO extends FieldInitializer<LocationDTO> {
    id: number;
    location: string;
}
