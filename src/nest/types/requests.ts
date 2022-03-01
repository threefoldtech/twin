import { Request } from 'express';

export class AuthenticatedRequest extends Request {
    userId: string;
}
