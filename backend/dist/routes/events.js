"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const events_1 = require("../sse/events");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true'
    });
    res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);
    (0, events_1.addClient)(res);
});
exports.default = router;
