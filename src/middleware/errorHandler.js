import ErrorCodes from '../errors/errorCodes.js';
import AppError from '../errors/appError.js';
import logger from '../utils/logger.js';

function normalizeError(err) {
    if (err instanceof AppError) {
        return err;
    }

    if (err.isJoi) {
        return new AppError(
            'Invalid request data',
            400,
            ErrorCodes.VALIDATION_ERROR,
            err.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        );
    }

    // Duplicate key
    if (err.code === 11000) {
        const fields = Object.keys(err.keyPattern ?? {});

        if (fields.includes('email')) {
            return new AppError(
                'A user with this email already exists',
                409,
                ErrorCodes.USER_ALREADY_EXISTS
            );
        }

        if (fields.includes('slug')) {
            return new AppError(
                'A resource with this slug already exists',
                409,
                ErrorCodes.DUPLICATE_RESOURCE
            );
        }

        return new AppError(
            'A resource with the provided value already exists',
            409,
            ErrorCodes.DUPLICATE_RESOURCE
        );
    }

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return new AppError(
            'Invalid resource identifier',
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }

    if (err.name === 'ValidationError') {
        return new AppError(
            'Validation error',
            400,
            ErrorCodes.VALIDATION_ERROR,
            Object.values(err.errors).map((error) => ({
                field: error.path,
                message: error.message
            }))
        );
    }

    if (err.name === 'TokenExpiredError') {
        return new AppError(
            'Token has expired',
            401,
            ErrorCodes.TOKEN_EXPIRED
        );
    }

    if (err.name === 'JsonWebTokenError') {
        return new AppError(
            'Invalid authentication token',
            401,
            ErrorCodes.INVALID_TOKEN
        );
    }

    return err;
}

export default function errorHandler(err, req, res, next) {
    const error = normalizeError(err);

    if (error.isOperational) {
        logger.warn(error);

        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            code: error.code,
            details: error.details
        });
    }

    logger.error(error);

    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        code: ErrorCodes.INTERNAL_ERROR
    });
}