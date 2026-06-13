import { Router, Request, Response } from 'express';
import { addClient } from '../sse/events';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true'
  });

  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

  addClient(res);
});

export default router;
