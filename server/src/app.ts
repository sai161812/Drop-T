import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { config } from './config.js';
import { testRouter } from './routes/testRoutes.js';
import { runRouter } from './routes/runRoutes.js';
import { uploadRouter } from './routes/uploadRoutes.js';
import { feedbackRouter } from './routes/feedbackRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { productRouter } from './routes/productRoutes.js';
import { authenticate } from './middleware/authMiddleware.js';
import { initDatabase } from './db/database.js';
import { seedDemoData } from './db/seed.js';

export function createApp(): Express {
  const app = express();

  // Initialize SQLite database & seed demo data
  initDatabase();
  try {
    seedDemoData();
  } catch (seedErr) {
    console.warn('Demo seed notice:', seedErr);
  }

  // Middleware
  app.use(cors());
  app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(authenticate);

  // Serve static uploads
  app.use('/uploads', express.static(config.uploadDir));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      version: '0.1.0',
      nodeEnv: config.nodeEnv,
      configuredModel: config.groqModel
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/tests', runRouter);
  app.use('/api/tests', testRouter);
  app.use('/api/simulation', runRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/feedback', feedbackRouter);

  // 404 handler for API
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API route not found' });
  });

  const baseDir = typeof import.meta.dirname === 'string' ? import.meta.dirname : process.cwd();
  const clientDir = path.resolve(baseDir, '../../client/dist');
  if (fs.existsSync(path.join(clientDir, 'index.html'))) {
    app.use(express.static(clientDir));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDir, 'index.html')));
  }

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred'
    });
  });

  return app;
}
