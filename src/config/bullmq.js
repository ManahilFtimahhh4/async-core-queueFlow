import Queue from 'bull';
import { config } from './env.js';
import { getRedisConnection } from './redis.js';
import { logger } from '../utils/logger.js';

/**
 * Bull Configuration & Queue Registry
 * Centralized queue setup with connection pooling and error handling
 */

const queues = new Map();
const workers = new Map();

export const createQueue = (queueName) => {
  // Return existing queue if already created
  if (queues.has(queueName)) {
    return queues.get(queueName);
  }

  // Bull uses simpler configuration
  const queue = new Queue(queueName, {
    redis: {
      host: config.redis.host,
      port: config.redis.port,
      db: config.redis.db,
      password: config.redis.password,
    },
  });

  queue.on('error', (err) => {
    logger.error(`Queue [${queueName}] error:`, err);
  });

  queues.set(queueName, queue);
  logger.info(`Queue registered: ${queueName}`);

  return queue;
};

export const getQueue = (queueName) => {
  const queue = queues.get(queueName);
  if (!queue) {
    throw new Error(`Queue [${queueName}] not found. Create it with createQueue() first.`);
  }
  return queue;
};

export const closeAllQueues = async () => {
  const closePromises = Array.from(queues.values()).map((queue) =>
    queue.close().catch((err) => logger.error('Queue close error:', err))
  );

  await Promise.all(closePromises);
  queues.clear();
  logger.info('All queues closed');
};

/**
 * Create worker (processor) with standard configuration
 * Bull processes jobs with queue.process()
 */
export const createWorker = (queueName, processor) => {
  // Ensure queue is created first
  const queue = createQueue(queueName);
  
  // Bull uses queue.process() for workers
  queue.process(config.queue.concurrency || 1, processor);

  queue.on('error', (err) => {
    logger.error(`Queue [${queueName}] error:`, err);
  });

  queue.on('failed', (job, err) => {
    logger.warn(`Job [${job.id}] failed:`, err.message);
  });

  queue.on('completed', (job) => {
    logger.info(`Job [${job.id}] completed`);
  });

  logger.info(`Worker started for queue: ${queueName}`);

  return queue;
};

export default {
  createQueue,
  getQueue,
  createWorker,
  closeAllQueues,
};
