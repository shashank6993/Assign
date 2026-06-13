"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastEvent = exports.addClient = void 0;
let clients = [];
const addClient = (res) => {
    clients.push(res);
    res.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
};
exports.addClient = addClient;
const broadcastEvent = (type, data) => {
    const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => {
        try {
            client.write(message);
        }
        catch (err) {
            console.error('Error writing to client:', err);
        }
    });
};
exports.broadcastEvent = broadcastEvent;
