"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatZodError = exports.sendError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details = []) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
const sendError = (res, statusCode, code, message, details = []) => {
    return res.status(statusCode).json({
        error: {
            code,
            message,
            details
        }
    });
};
exports.sendError = sendError;
const formatZodError = (error) => {
    return error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
    }));
};
exports.formatZodError = formatZodError;
