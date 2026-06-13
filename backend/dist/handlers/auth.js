"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.login = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const validation_1 = require("../utils/validation");
const prisma_1 = __importDefault(require("../utils/prisma"));
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const signup = async (req, res) => {
    try {
        const parseResult = validation_1.signupSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, errors_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', (0, errors_1.formatZodError)(parseResult.error));
        }
        const { name, email, password, role } = parseResult.data;
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return (0, errors_1.sendError)(res, 400, 'BAD_REQUEST', 'Email address is already in use');
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'USER'
            }
        });
        const token = (0, jwt_1.generateToken)({ userId: user.id, role: user.role });
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE
        });
        return res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred during signup');
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const parseResult = validation_1.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, errors_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', (0, errors_1.formatZodError)(parseResult.error));
        }
        const { email, password } = parseResult.data;
        const user = await prisma_1.default.user.findUnique({
            where: { email }
        });
        if (!user) {
            return (0, errors_1.sendError)(res, 401, 'UNAUTHORIZED', 'Invalid email or password');
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return (0, errors_1.sendError)(res, 401, 'UNAUTHORIZED', 'Invalid email or password');
        }
        const token = (0, jwt_1.generateToken)({ userId: user.id, role: user.role });
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE
        });
        return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred during login');
    }
};
exports.login = login;
const logout = async (_req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    return res.json({ success: true });
};
exports.logout = logout;
const me = async (req, res) => {
    if (!req.user) {
        return (0, errors_1.sendError)(res, 401, 'UNAUTHORIZED', 'Not authenticated');
    }
    return res.json(req.user);
};
exports.me = me;
