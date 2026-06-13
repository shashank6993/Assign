"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tasks_1 = require("../handlers/tasks");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// Protect all routes in this router
router.use(auth_1.authenticate);
router.get('/', tasks_1.getTasks);
router.get('/:id', tasks_1.getTaskById);
router.post('/', tasks_1.createTask);
router.patch('/:id', tasks_1.updateTask);
router.delete('/:id', tasks_1.deleteTask);
// Activity and attachments
router.get('/:id/activity', tasks_1.getTaskActivity);
router.get('/:id/attachments', tasks_1.getTaskAttachments);
router.post('/:id/attachments', upload_1.upload.single('file'), tasks_1.createTaskAttachment);
exports.default = router;
