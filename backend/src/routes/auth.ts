import { Router } from 'express';
import { signup, login, logout, me } from '../handlers/auth';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me as any);

router.get('/users', authenticate as any, authorize(['ADMIN']) as any, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while listing users'
      }
    });
  }
});

export default router;
