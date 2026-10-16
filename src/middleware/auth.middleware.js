import * as tokenService from '../services/token.service.js';
import AppError from '../errors/appError.js';
import { ErrorCodes } from '../errors/errorCodes.js';

export function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if(!auth?.startsWith('Bearer ')) {
        return next(new AppError('Access token is required',401, ErrorCodes.UNAUTHORIZED));
    }

    const token = auth.slice(7);
    let payload;

    try{
        payload = tokenService.verifyAccessToken(token);
    } catch(error){
        if(error.name === 'TokenExpiredError') {
            return next(
                new AppError(
                    'Access token has expired',
                    401,
                    ErrorCodes.TOKEN_EXPIRED
                )
            )
        }

        return next(
            new AppError(
                'Access token is invalid',
                401,
                ErrorCodes.INVALID_TOKEN
            )
        )
    }

    if(!payload.userId) {
        return next(
            new AppError
            (
                'Invalid token payload', 
                401, 
                ErrorCodes.INVALID_TOKEN
            )
        );
    }

    req.user = {
        id: String(payload.userId),
        sessionId: String(payload.sessionId)
    };

    next();
}

