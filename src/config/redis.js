import Redis from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Redis Connection Singleton
 * Provides centralized Redis connection with pooling and error handling
 */

let redisInstance = null;

export const createRedisConnection = () => {
  if (redisInstance) {
    return redisInstance;
  }

  redisInstance = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    lazyConnect: false,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,  // FIXED: Enable ready check so commands wait for connection
    enableOfflineQueue: true,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    family: 4,
    connectTimeout: 10000,
  });

  redisInstance.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redisInstance.on('ready', () => {
    logger.info('Redis ready for commands');
  });

  redisInstance.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });

  redisInstance.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redisInstance;
};

export const getRedisConnection = () => {
  if (!redisInstance) {
    throw new Error('Redis connection not initialized. Call createRedisConnection() first.');
  }
  return redisInstance;
};

export const closeRedisConnection = async () => {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
    logger.info('Redis connection closed');
  }
};

export default {
  createRedisConnection,
  getRedisConnection,
  closeRedisConnection,
};
