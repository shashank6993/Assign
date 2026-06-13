"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const prisma_1 = __importDefault(require("../utils/prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock('../utils/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn()
        },
        task: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
        },
        activityLog: {
            create: jest.fn()
        }
    }
}));
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const generateTestCookie = (userId, role = 'USER') => {
    const token = jsonwebtoken_1.default.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
    return `token=${token}`;
};
describe('Tasks Endpoints', () => {
    const userId = 'user-123';
    const cookie = generateTestCookie(userId);
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock user identification in middleware
        prisma_1.default.user.findUnique.mockResolvedValue({
            id: userId,
            name: 'Test User',
            email: 'test@example.com',
            role: 'USER'
        });
    });
    afterAll((done) => {
        index_1.server.close(done);
    });
    describe('GET /api/tasks', () => {
        it('should block unauthenticated requests', async () => {
            const res = await (0, supertest_1.default)(index_1.app).get('/api/tasks');
            expect(res.status).toBe(401);
        });
        it('should return paginated task list for authenticated user', async () => {
            const mockTasks = [
                { id: 'task-1', title: 'Task 1', userId, status: 'TODO', priority: 'MEDIUM' },
                { id: 'task-2', title: 'Task 2', userId, status: 'IN_PROGRESS', priority: 'HIGH' }
            ];
            prisma_1.default.task.findMany.mockResolvedValue(mockTasks);
            prisma_1.default.task.count.mockResolvedValue(2);
            const res = await (0, supertest_1.default)(index_1.app)
                .get('/api/tasks')
                .set('Cookie', cookie);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('tasks');
            expect(res.body.tasks).toHaveLength(2);
            expect(res.body.pagination).toBeDefined();
        });
    });
    describe('POST /api/tasks', () => {
        it('should successfully create a task and log activity', async () => {
            const mockTask = {
                id: 'task-new',
                title: 'New Task',
                description: 'New Description',
                status: 'TODO',
                priority: 'MEDIUM',
                userId
            };
            prisma_1.default.task.create.mockResolvedValue(mockTask);
            prisma_1.default.activityLog.create.mockResolvedValue({});
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/tasks')
                .set('Cookie', cookie)
                .send({
                title: 'New Task',
                description: 'New Description',
                status: 'TODO',
                priority: 'MEDIUM',
                dueDate: new Date().toISOString()
            });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id', 'task-new');
            expect(prisma_1.default.task.create).toHaveBeenCalled();
            expect(prisma_1.default.activityLog.create).toHaveBeenCalled();
        });
        it('should fail validation with invalid priority', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/tasks')
                .set('Cookie', cookie)
                .send({
                title: 'New Task',
                priority: 'SUPER_HIGH',
                dueDate: new Date().toISOString()
            });
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });
    describe('DELETE /api/tasks/:id', () => {
        it('should delete own task', async () => {
            const existingTask = {
                id: 'task-1',
                title: 'My Task',
                userId
            };
            prisma_1.default.task.findUnique.mockResolvedValue(existingTask);
            prisma_1.default.task.delete.mockResolvedValue(existingTask);
            prisma_1.default.activityLog.create.mockResolvedValue({});
            const res = await (0, supertest_1.default)(index_1.app)
                .delete('/api/tasks/task-1')
                .set('Cookie', cookie);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('id', 'task-1');
        });
        it('should block deleting another user\'s task', async () => {
            const otherTask = {
                id: 'task-2',
                title: 'Other Task',
                userId: 'other-user'
            };
            prisma_1.default.task.findUnique.mockResolvedValue(otherTask);
            const res = await (0, supertest_1.default)(index_1.app)
                .delete('/api/tasks/task-2')
                .set('Cookie', cookie);
            expect(res.status).toBe(403);
        });
    });
});
