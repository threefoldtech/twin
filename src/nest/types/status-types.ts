import { EntityData } from 'redis-om';

export interface Status extends EntityData {
    avatar: string;
    isOnline: boolean;
}

export interface StatusUpdate {
    id: string;
    isOnline: boolean;
}
