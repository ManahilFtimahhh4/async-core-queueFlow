import express from 'express';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { createRedisConnection, closeRedisConnection } from './config/redis.js';
import { closeAllQueues } from './config/bullmq.js';
import { logger } from './utils/logger.js';
import { loggingMiddleware } from './middleware/logging.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { getQuickHealth } from './controllers/healthController.js';
import routes from './routes/index.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Static Files Configuration
 * Serve dashboard frontend and assets from project root
 * This allows serving:
 * - /public/index.html
 * - /styles/*.css
 * - /js/*.js
 */
const projectRoot = path.join(__dirname, '..');
app.use(express.static(projectRoot));

/**
 * Dashboard Home Route
 * Serve index.html for root path
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'public', 'index.html'));
});

/**
 * Quick Health Check (lightweight)
 */
app.get('/health', getQuickHealth);

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
