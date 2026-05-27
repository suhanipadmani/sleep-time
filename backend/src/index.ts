import express from 'express';
import cors from 'cors';
import { config } from '@/config';
import { initDB } from '@/db';
import routes from '@/routes';
import { errorHandler } from '@/middlewares/errorHandler';
import { logger } from '@/logger';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

import { authService } from '@/services/authService';

const startServer = async () => {
  try {
    await initDB();
    await authService.seedAdmin();
    
    app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server: ' + error);
    process.exit(1);
  }
};

startServer();
