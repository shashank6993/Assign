"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskAttachment = exports.getTaskAttachments = exports.getTaskActivity = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const validation_1 = require("../utils/validation");
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
const activity_1 = require("../utils/activity");
const events_1 = require("../sse/events");
const getTasks = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';
        // Build where clause
        const where = {};
        // Authorization scoping
        if (user.role === 'ADMIN') {
            if (req.query.userId) {
                where.userId = req.query.userId;
            }
        }
        else {
            where.userId = user.id;
        }
        // Filters
        if (status) {
            if (Object.values(client_1.TaskStatus).includes(status)) {
                where.status = status;
            }
            else {
                return (0, errors_1.sendError)(res, 400, 'BAD_REQUEST', `Invalid status value: ${status}`);
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
            return (0, errors_1.sendError)(res, 400, 'BAD_REQUEST', `Sorting by ${sort} is not supported`);
        }
        if (order !== 'asc' && order !== 'desc') {
            return (0, errors_1.sendError)(res, 400, 'BAD_REQUEST', `Order must be 'asc' or 'desc'`);
        }
        const skip = (page - 1) * limit;
        const take = limit;
        const total = await prisma_1.default.task.count({ where });
        const tasks = await prisma_1.default.task.findMany({
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
    }
    catch (error) {
        console.error('Get tasks error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while listing tasks');
    }
};
exports.getTasks = getTasks;
const getTaskById = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const task = await prisma_1.default.task.findUnique({
            where: { id },
            include: {
                attachments: true
            }
        });
        if (!task) {
            return (0, errors_1.sendError)(res, 404, 'NOT_FOUND', 'Task not found');
        }
        if (user.role !== 'ADMIN' && task.userId !== user.id) {
            return (0, errors_1.sendError)(res, 403, 'FORBIDDEN', 'Access denied');
        }
        return res.json(task);
    }
    catch (error) {
        console.error('Get task details error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while fetching task details');
    }
};
exports.getTaskById = getTaskById;
const createTask = async (req, res) => {
    try {
        const user = req.user;
        const parseResult = validation_1.createTaskSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, errors_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', (0, errors_1.formatZodError)(parseResult.error));
        }
        const { title, description, status, priority, dueDate } = parseResult.data;
        const task = await prisma_1.default.task.create({
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
        await (0, activity_1.logActivity)(task.id, user.id, 'CREATE', null, task);
        // Broadcast SSE
        (0, events_1.broadcastEvent)('TASK_CREATED', task);
        return res.status(201).json(task);
    }
    catch (error) {
        console.error('Create task error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while creating the task');
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const task = await prisma_1.default.task.findUnique({
            where: { id }
        });
        if (!task) {
            return (0, errors_1.sendError)(res, 404, 'NOT_FOUND', 'Task not found');
        }
        if (user.role !== 'ADMIN' && task.userId !== user.id) {
            return (0, errors_1.sendError)(res, 403, 'FORBIDDEN', 'Access denied');
        }
        const parseResult = validation_1.updateTaskSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, errors_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', (0, errors_1.formatZodError)(parseResult.error));
        }
        const updatedTask = await prisma_1.default.task.update({
            where: { id },
            data: parseResult.data,
            include: {
                attachments: true
            }
        });
        // Log Activity
        if (task.status !== updatedTask.status) {
            await (0, activity_1.logActivity)(id, user.id, 'STATUS_CHANGE', { status: task.status }, { status: updatedTask.status });
        }
        else {
            await (0, activity_1.logActivity)(id, user.id, 'UPDATE', task, updatedTask);
        }
        // Broadcast SSE
        (0, events_1.broadcastEvent)('TASK_UPDATED', updatedTask);
        // Check if task was completed
        if (updatedTask.status === 'COMPLETED' && task.status !== 'COMPLETED') {
            (0, events_1.broadcastEvent)('TASK_COMPLETED', updatedTask);
        }
        return res.json(updatedTask);
    }
    catch (error) {
        console.error('Update task error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while updating the task');
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const task = await prisma_1.default.task.findUnique({
            where: { id }
        });
        if (!task) {
            return (0, errors_1.sendError)(res, 404, 'NOT_FOUND', 'Task not found');
        }
        if (user.role !== 'ADMIN' && task.userId !== user.id) {
            return (0, errors_1.sendError)(res, 403, 'FORBIDDEN', 'Access denied');
        }
        // Log Activity before cascade delete
        await (0, activity_1.logActivity)(id, user.id, 'DELETE', task, null);
        await prisma_1.default.task.delete({
            where: { id }
        });
        // Broadcast SSE
        (0, events_1.broadcastEvent)('TASK_DELETED', { id });
        return res.json({ success: true, id });
    }
    catch (error) {
        console.error('Delete task error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while deleting the task');
    }
};
exports.deleteTask = deleteTask;
// GET /api/tasks/:id/activity
const getTaskActivity = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const task = await prisma_1.default.task.findUnique({
            where: { id }
        });
        if (!task) {
            return (0, errors_1.sendError)(res, 404, 'NOT_FOUND', 'Task not found');
        }
        if (user.role !== 'ADMIN' && task.userId !== user.id) {
            return (0, errors_1.sendError)(res, 403, 'FORBIDDEN', 'Access denied');
        }
        const logs = await prisma_1.default.activityLog.findMany({
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
    }
    catch (error) {
        console.error('Get task activity error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while fetching task activity');
    }
};
exports.getTaskActivity = getTaskActivity;
// GET /api/tasks/:id/attachments
const getTaskAttachments = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const task = await prisma_1.default.task.findUnique({
            where: { id }
        });
        if (!task) {
            return (0, errors_1.sendError)(res, 404, 'NOT_FOUND', 'Task not found');
        }
        if (user.role !== 'ADMIN' && task.userId !== user.id) {
            return (0, errors_1.sendError)(res, 403, 'FORBIDDEN', 'Access denied');
        }
        const attachments = await prisma_1.default.attachment.findMany({
            where: { taskId: id },
            orderBy: { uploadedAt: 'desc' }
        });
        return res.json(attachments);
    }
    catch (error) {
        console.error('Get task attachments error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while fetching task attachments');
    }
};
exports.getTaskAttachments = getTaskAttachments;
// POST /api/tasks/:id/attachments
const createTaskAttachment = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const file = req.file;
        if (!file) {
            return (0, errors_1.sendError)(res, 400, 'BAD_REQUEST', 'No file was uploaded');
        }
        const task = await prisma_1.default.task.findUnique({
            where: { id }
        });
        if (!task) {
            return (0, errors_1.sendError)(res, 404, 'NOT_FOUND', 'Task not found');
        }
        if (user.role !== 'ADMIN' && task.userId !== user.id) {
            return (0, errors_1.sendError)(res, 403, 'FORBIDDEN', 'Access denied');
        }
        const attachment = await prisma_1.default.attachment.create({
            data: {
                taskId: id,
                fileName: file.originalname,
                fileUrl: `/uploads/${file.filename}`,
                mimeType: file.mimetype
            }
        });
        // Log activity for attachment uploaded
        await (0, activity_1.logActivity)(id, user.id, 'ATTACHMENT_ADDED', null, { fileName: file.originalname });
        // Broadcast update
        const updatedTask = await prisma_1.default.task.findUnique({
            where: { id },
            include: { attachments: true }
        });
        if (updatedTask) {
            (0, events_1.broadcastEvent)('TASK_UPDATED', updatedTask);
        }
        return res.status(201).json(attachment);
    }
    catch (error) {
        console.error('Create task attachment error:', error);
        return (0, errors_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred while uploading task attachment');
    }
};
exports.createTaskAttachment = createTaskAttachment;
