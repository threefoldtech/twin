import { ContactInterface, ROLES } from '../types';

export default class Contact implements ContactInterface {
    id: string;
    location: string;
    roles?: ROLES[];

    constructor(id: string, location: string, roles?: ROLES[]) {
        this.id = id;
        this.location = location;
        this.roles = roles;
    }
}
