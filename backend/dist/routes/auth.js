"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../handlers/auth");
const auth_2 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../utils/prisma"));
const router = (0, express_1.Router)();
router.post('/signup', auth_1.signup);
router.post('/login', auth_1.login);
router.post('/logout', auth_1.logout);
router.get('/me', auth_2.authenticate, auth_1.me);
router.get('/users', auth_2.authenticate, (0, auth_2.authorize)(['ADMIN']), async (_req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });
        return res.json(users);
    }
    catch (error) {
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred while listing users'
            }
        });
    }
});
exports.default = router;
