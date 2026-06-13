import request from 'supertest';
import { app, server } from '../index';
import prisma from '../utils/prisma';
import jwt from 'jsonwebtoken';

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

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345678901234567890';

const generateTestCookie = (userId: string, role = 'USER') => {
  const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
  return `token=${token}`;
};

describe('Tasks Endpoints', () => {
  const userId = 'user-123';
  const cookie = generateTestCookie(userId);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user identification in middleware
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER'
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /api/tasks', () => {
    it('should block unauthenticated requests', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(401);
    });

    it('should return paginated task list for authenticated user', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', userId, status: 'TODO', priority: 'MEDIUM' },
        { id: 'task-2', title: 'Task 2', userId, status: 'IN_PROGRESS', priority: 'HIGH' }
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);
      (prisma.task.count as jest.Mock).mockResolvedValue(2);

      const res = await request(app)
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

      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

      const res = await request(app)
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
      expect(prisma.task.create).toHaveBeenCalled();
      expect(prisma.activityLog.create).toHaveBeenCalled();
    });

    it('should fail validation with invalid priority', async () => {
      const res = await request(app)
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

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(existingTask);
      (prisma.task.delete as jest.Mock).mockResolvedValue(existingTask);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

      const res = await request(app)
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

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(otherTask);

      const res = await request(app)
        .delete('/api/tasks/task-2')
        .set('Cookie', cookie);

      expect(res.status).toBe(403);
    });
  });
});
