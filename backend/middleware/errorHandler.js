class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
    }
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.originalUrl || req.url}`,
        code: 'ROUTE_NOT_FOUND'
    });
};

const errorHandler = (err, req, res, next) => {
    const statusCode = Number(err?.statusCode || 500);
    const code = String(err?.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'));
    const message = statusCode >= 500
        ? 'Internal server error'
        : String(err?.message || 'Request failed');

    const payload = {
        success: false,
        message,
        code
    };

    if (Array.isArray(err?.details) && err.details.length > 0) {
        payload.errors = err.details;
    }

    if (process.env.NODE_ENV !== 'production') {
        payload.debug = {
            stack: err?.stack,
            rawMessage: err?.message
        };
    }

    if (statusCode >= 500) {
        console.error('[ERROR]', {
            code,
            message: err?.message,
            route: req?.originalUrl || req?.url,
            method: req?.method
        });
    }

    res.status(statusCode).json(payload);
};

module.exports = {
    AppError,
    asyncHandler,
    notFoundHandler,
    errorHandler
};
