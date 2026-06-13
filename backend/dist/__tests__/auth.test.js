"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const prisma_1 = __importDefault(require("../utils/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
jest.mock('../utils/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn()
        }
    }
}));
describe('Auth Endpoints', () => {
    afterAll((done) => {
        index_1.server.close(done);
    });
    describe('POST /api/auth/signup', () => {
        it('should successfully register a new user', async () => {
            const mockUser = {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma_1.default.user.findUnique.mockResolvedValue(null);
            prisma_1.default.user.create.mockResolvedValue(mockUser);
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'USER'
            });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id', 'user-123');
            expect(res.body).toHaveProperty('email', 'test@example.com');
            expect(res.body).not.toHaveProperty('password');
            expect(res.header['set-cookie']).toBeDefined();
        });
        it('should fail if email is already taken', async () => {
            const existingUser = {
                id: 'user-123',
                email: 'test@example.com'
            };
            prisma_1.default.user.findUnique.mockResolvedValue(existingUser);
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('BAD_REQUEST');
        });
    });
    describe('POST /api/auth/login', () => {
        it('should successfully login and return user details', async () => {
            const hashedPassword = await bcrypt_1.default.hash('password123', 10);
            const mockUser = {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                password: hashedPassword,
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma_1.default.user.findUnique.mockResolvedValue(mockUser);
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', 'user-123');
            expect(res.header['set-cookie']).toBeDefined();
        });
        it('should fail with invalid credentials', async () => {
            prisma_1.default.user.findUnique.mockResolvedValue(null);
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send({
                email: 'wrong@example.com',
                password: 'wrongpassword'
            });
            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });
    });
});
