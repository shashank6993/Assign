import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './routes/auth';
import tasksRouter from './routes/tasks';
import eventsRouter from './routes/events';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/events', eventsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = process.env.NODE_ENV === 'test'
  ? app.listen(0)
  : app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

export { app, server };
