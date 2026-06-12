// ============================================================
// ERPEX — Global Error Handler Middleware
// ============================================================
import { ZodError } from 'zod';
export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export function errorHandler(err, _req, res, _next) {
    // Zod validation errors
    if (err instanceof ZodError) {
        const errors = {};
        err.errors.forEach((e) => {
            const path = e.path.join('.');
            if (!errors[path])
                errors[path] = [];
            errors[path].push(e.message);
        });
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
        return;
    }
    // Application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // Unknown errors
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
}
//# sourceMappingURL=errorHandler.js.map