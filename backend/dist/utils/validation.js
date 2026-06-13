"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskSchema = exports.createTaskSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    role: zod_1.z.nativeEnum(client_1.Role).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
    description: zod_1.z.string().optional().nullable(),
    status: zod_1.z.nativeEnum(client_1.TaskStatus).default(client_1.TaskStatus.TODO),
    priority: zod_1.z.nativeEnum(client_1.Priority).default(client_1.Priority.MEDIUM),
    dueDate: zod_1.z.preprocess((arg) => {
        if (typeof arg === 'string' && arg.trim() !== '')
            return new Date(arg);
        return arg;
    }, zod_1.z.date({
        required_error: 'Due date is required',
        invalid_type_error: 'Due date must be a valid date'
    })),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters').optional(),
    description: zod_1.z.string().optional().nullable(),
    status: zod_1.z.nativeEnum(client_1.TaskStatus).optional(),
    priority: zod_1.z.nativeEnum(client_1.Priority).optional(),
    dueDate: zod_1.z.preprocess((arg) => {
        if (typeof arg === 'string' && arg.trim() !== '')
            return new Date(arg);
        return arg;
    }, zod_1.z.date({
        invalid_type_error: 'Due date must be a valid date'
    })).optional(),
});
