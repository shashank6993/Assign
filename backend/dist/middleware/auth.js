"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const prisma_1 = __importDefault(require("../utils/prisma"));
const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return (0, errors_1.sendError)(res, 401, 'UNAUTHORIZED', 'Authentication token missing or invalid');
        }
        let decoded;
        try {
            decoded = (0, jwt_1.verifyToken)(token);
        }
        catch (err) {
            return (0, errors_1.sendError)(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user) {
            return (0, errors_1.sendError)(res, 401, 'UNAUTHORIZED', 'User not found');
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };
        return next();
    }
    catch (error) {
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, errors_1.sendError)(res, 401, 'UNAUTHORIZED', 'User not authenticated');
        }
        if (!roles.includes(req.user.role)) {
            return (0, errors_1.sendError)(res, 403, 'FORBIDDEN', 'Access denied');
        }
        return next();
    };
};
exports.authorize = authorize;
