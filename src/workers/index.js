/**
 * Worker Processes
 * This file starts and manages all worker processes
 * Run this in a separate process: npm run worker
 */

import { createRedisConnection, closeRedisConnection } from '../config/redis.js';
import { createQueue } from '../config/bullmq.js';
import { initializeEmailWorker } from './emailWorker.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { logger } from '../utils/logger.js';

let workers = [];

const initializeWorkers = () => {
  // Create Redis connection for workers
  createRedisConnection();

  // Initialize Dead Letter Queue
  createQueue(QUEUE_NAMES.emailDLQ);
  logger.info('Dead Letter Queue initialized:', QUEUE_NAMES.emailDLQ);

  // Initialize email worker
  const emailWorker = initializeEmailWorker();
  workers.push(emailWorker);

  logger.info('All workers initialized');
};

const shutdownWorkers = async () => {
  logger.info('Shutting down workers...');

  await Promise.all(workers.map((worker) =>
    worker.close().catch((err) => logger.error('Worker close error:', err))
  ));

  await closeRedisConnection();
  logger.info('Workers shutdown complete');
};

// Graceful shutdown
process.on('SIGTERM', shutdownWorkers);
process.on('SIGINT', shutdownWorkers);

// Start workers
initializeWorkers();
logger.info('Worker process started');

