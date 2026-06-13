import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { createTaskSchema, updateTaskSchema } from '../utils/validation';
import { sendError, formatZodError } from '../utils/errors';
import { TaskStatus } from '@prisma/client';
import { logActivity } from '../utils/activity';
import { broadcastEvent } from '../sse/events';

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as TaskStatus | undefined;
    const search = req.query.search as string | undefined;
    const sort = (req.query.sort as string) || 'createdAt';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';

    // Build where clause
    const where: any = {};

    // Authorization scoping
    if (user.role === 'ADMIN') {
      if (req.query.userId) {
        where.userId = req.query.userId as string;
      }
    } else {
      where.userId = user.id;
    }

    // Filters
    if (status) {
      if (Object.values(TaskStatus).includes(status)) {
        where.status = status;
      } else {
        return sendError(res, 400, 'BAD_REQUEST', `Invalid status value: ${status}`);
      }
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Sort column validation
    const allowedSortFields = ['createdAt', 'dueDate', 'priority'];
    if (!allowedSortFields.includes(sort)) {
      return sendError(res, 400, 'BAD_REQUEST', `Sorting by ${sort} is not supported`);
    }

    if (order !== 'asc' && order !== 'desc') {
      return sendError(res, 400, 'BAD_REQUEST', `Order must be 'asc' or 'desc'`);
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const total = await prisma.task.count({ where });
    const tasks = await prisma.task.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sort]: order
      },
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.json({
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while listing tasks');
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        attachments: true
      }
    });

    if (!task) {
      return sendError(res, 404, 'NOT_FOUND', 'Task not found');
    }

    if (user.role !== 'ADMIN' && task.userId !== user.id) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied');
    }

    return res.json(task);
  } catch (error) {
    console.error('Get task details error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while fetching task details');
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parseResult = createTaskSchema.safeParse(req.body);

    if (!parseResult.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation failed',
        formatZodError(parseResult.error)
      );
    }

    const { title, description, status, priority, dueDate } = parseResult.data;

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title,
        description,
        status,
        priority,
        dueDate
      },
      include: {
        attachments: true
      }
    });

    // Log activity
    await logActivity(task.id, user.id, 'CREATE', null, task);

    // Broadcast SSE
    broadcastEvent('TASK_CREATED', task);

    return res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while creating the task');
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return sendError(res, 404, 'NOT_FOUND', 'Task not found');
    }

    if (user.role !== 'ADMIN' && task.userId !== user.id) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied');
    }

    const parseResult = updateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation failed',
        formatZodError(parseResult.error)
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: parseResult.data,
      include: {
        attachments: true
      }
    });

    // Log Activity
    if (task.status !== updatedTask.status) {
      await logActivity(id, user.id, 'STATUS_CHANGE', { status: task.status }, { status: updatedTask.status });
    } else {
      await logActivity(id, user.id, 'UPDATE', task, updatedTask);
    }

    // Broadcast SSE
    broadcastEvent('TASK_UPDATED', updatedTask);
    
    // Check if task was completed
    if (updatedTask.status === 'COMPLETED' && task.status !== 'COMPLETED') {
      broadcastEvent('TASK_COMPLETED', updatedTask);
    }

    return res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while updating the task');
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return sendError(res, 404, 'NOT_FOUND', 'Task not found');
    }

    if (user.role !== 'ADMIN' && task.userId !== user.id) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied');
    }

    // Log Activity before cascade delete
    await logActivity(id, user.id, 'DELETE', task, null);

    await prisma.task.delete({
      where: { id }
    });

    // Broadcast SSE
    broadcastEvent('TASK_DELETED', { id });

    return res.json({ success: true, id });
  } catch (error) {
    console.error('Delete task error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while deleting the task');
  }
};

// GET /api/tasks/:id/activity
export const getTaskActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return sendError(res, 404, 'NOT_FOUND', 'Task not found');
    }

    if (user.role !== 'ADMIN' && task.userId !== user.id) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied');
    }

    const logs = await prisma.activityLog.findMany({
      where: { taskId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.json(logs);
  } catch (error) {
    console.error('Get task activity error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while fetching task activity');
  }
};

// GET /api/tasks/:id/attachments
export const getTaskAttachments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return sendError(res, 404, 'NOT_FOUND', 'Task not found');
    }

    if (user.role !== 'ADMIN' && task.userId !== user.id) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied');
    }

    const attachments = await prisma.attachment.findMany({
      where: { taskId: id },
      orderBy: { uploadedAt: 'desc' }
    });

    return res.json(attachments);
  } catch (error) {
    console.error('Get task attachments error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while fetching task attachments');
  }
};

// POST /api/tasks/:id/attachments
export const createTaskAttachment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return sendError(res, 400, 'BAD_REQUEST', 'No file was uploaded');
    }

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return sendError(res, 404, 'NOT_FOUND', 'Task not found');
    }

    if (user.role !== 'ADMIN' && task.userId !== user.id) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied');
    }

    const attachment = await prisma.attachment.create({
      data: {
        taskId: id,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        mimeType: file.mimetype
      }
    });

    // Log activity for attachment uploaded
    await logActivity(id, user.id, 'ATTACHMENT_ADDED', null, { fileName: file.originalname });

    // Broadcast update
    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: { attachments: true }
    });
    if (updatedTask) {
      broadcastEvent('TASK_UPDATED', updatedTask);
    }

    return res.status(201).json(attachment);
  } catch (error) {
    console.error('Create task attachment error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while uploading task attachment');
  }
};
