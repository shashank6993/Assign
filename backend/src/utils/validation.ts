import { z } from 'zod';
import { Role, TaskStatus, Priority } from '@prisma/client';

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.nativeEnum(Role).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' && arg.trim() !== '') return new Date(arg);
      return arg;
    },
    z.date({
      required_error: 'Due date is required',
      invalid_type_error: 'Due date must be a valid date'
    })
  ),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters').optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' && arg.trim() !== '') return new Date(arg);
      return arg;
    },
    z.date({
      invalid_type_error: 'Due date must be a valid date'
    })
  ).optional(),
});
