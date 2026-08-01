/**
 * Async Core - Background Processing System
 * Main Express Server
 */

import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { config } from './config/env.js';
import { createRedisConnection, closeRedisConnection } from './config/redis.js';
import { closeAllQueues } from './config/bullmq.js';
import { logger } from './utils/logger.js';
import { loggingMiddleware } from './middleware/logging.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

/**
 * Middleware Configuration
 */
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(loggingMiddleware);

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: config.app.name,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * Error Handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Server Startup
 */
let server;

const startServer = async () => {
  try {
    // Initialize Redis connection
    createRedisConnection();
    logger.info('Redis connection established');

    // Start Express server
    server = app.listen(config.port, config.host, () => {
      logger.info(`${config.app.name} server running on ${config.host}:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

/**
 * Graceful Shutdown
 */
const shutdownServer = async () => {
  logger.info('Shutting down server...');

  // Close server
  if (server) {
    await new Promise((resolve) => {
      server.close(() => {
        logger.info('Express server closed');
        resolve();
      });
    });
  }

  // Close queues
  await closeAllQueues();

  // Close Redis
  await closeRedisConnection();

  logger.info('Server shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', shutdownServer);
process.on('SIGINT', shutdownServer);

// Start server
startServer();

export default app;
