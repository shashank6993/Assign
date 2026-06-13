import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskActivity,
  getTaskAttachments,
  createTaskAttachment
} from '../handlers/tasks';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Protect all routes in this router
router.use(authenticate as any);

router.get('/', getTasks as any);
router.get('/:id', getTaskById as any);
router.post('/', createTask as any);
router.patch('/:id', updateTask as any);
router.delete('/:id', deleteTask as any);

// Activity and attachments
router.get('/:id/activity', getTaskActivity as any);
router.get('/:id/attachments', getTaskAttachments as any);
router.post('/:id/attachments', upload.single('file'), createTaskAttachment as any);

export default router;
