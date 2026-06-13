"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const events_1 = __importDefault(require("./routes/events"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 8080;
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Serve static uploads
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));
// Mount routes
app.use('/api/auth', auth_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/events', events_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
const server = process.env.NODE_ENV === 'test'
    ? app.listen(0)
    : app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
exports.server = server;
