import express from 'express';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';
import { yggdrasilIsInitialized } from '../index';

/**
 * Handles authentication check
 * @param error
 * @param request
 * @param response
 * @param next
 */

export const requiresAuthentication = (
    error: Error,
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
): express.Response | void => {
    const hasSession = !!request?.session?.userId;
    const isDevelopmentMode = process.env.ENVIRONMENT === 'development';
    if (!hasSession && (!isDevelopmentMode || !yggdrasilIsInitialized)) {
        throw new HttpError(StatusCodes.UNAUTHORIZED);
    }

    next();
};
