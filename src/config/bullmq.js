import { Queue, Worker } from 'bullmq';
import { config } from './env.js';
import { getRedisConnection } from './redis.js';
import { logger } from '../utils/logger.js';

/**
 * BullMQ Configuration & Queue Registry
 * Centralized queue setup with connection pooling and error handling
 */

const queues = new Map();

export const createQueue = (queueName) => {
  // Return existing queue if already created
  if (queues.has(queueName)) {
    return queues.get(queueName);
  }

  const queue = new Queue(queueName, {
    connection: getRedisConnection(),
    settings: {
      stalledInterval: 5000,
      maxStalledCount: 2,
      lockDuration: 30000,
      lockRenewTime: 15000,
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
 * Create worker with standard configuration
 * Workers are separate from queues and can be run in separate processes
 */
export const createWorker = (queueName, processor) => {
  const worker = new Worker(queueName, processor, {
    connection: getRedisConnection(),
    concurrency: config.queue.concurrency,
    settings: {
      stalledInterval: 5000,
      maxStalledCount: 2,
      lockDuration: 30000,
      lockRenewTime: 15000,
    },
  });

  worker.on('error', (err) => {
    logger.error(`Worker [${queueName}] error:`, err);
  });

  worker.on('failed', (job, err) => {
    logger.warn(`Job [${job.id}] failed:`, err.message);
  });

  worker.on('completed', (job) => {
    logger.info(`Job [${job.id}] completed`);
  });

  logger.info(`Worker started for queue: ${queueName}`);

  return worker;
};

export default {
  createQueue,
  getQueue,
  createWorker,
  closeAllQueues,
};
