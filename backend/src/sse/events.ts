import { Response } from 'express';

let clients: Response[] = [];

export const addClient = (res: Response) => {
  clients.push(res);
  
  res.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
};

export const broadcastEvent = (type: string, data: any) => {
  const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (err) {
      console.error('Error writing to client:', err);
    }
  });
};
