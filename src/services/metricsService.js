import { createQueue } from '../config/bullmq.js';
import { getRedisConnection } from '../config/redis.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { logger } from '../utils/logger.js';

/**
 * Metrics Service
 * Collects and aggregates system metrics for monitoring and dashboard
 */

class MetricsService {
  constructor() {
    this.startTime = Date.now();
    this.jobMetrics = {
      totalProcessed: 0,
      totalFailed: 0,
      totalRetried: 0,
      processingTimes: [],
    };
  }

  recordJobCompletion(executionTime) {
    this.jobMetrics.totalProcessed++;
    this.jobMetrics.processingTimes.push(executionTime);
    // Keep only last 1000 times for performance
    if (this.jobMetrics.processingTimes.length > 1000) {
      this.jobMetrics.processingTimes.shift();
    }
  }

  recordJobFailure() {
    this.jobMetrics.totalFailed++;
  }

  recordJobRetry() {
    this.jobMetrics.totalRetried++;
  }

  getAverageProcessingTime() {
    if (this.jobMetrics.processingTimes.length === 0) return 0;
    const sum = this.jobMetrics.processingTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.jobMetrics.processingTimes.length);
  }

  getLongestProcessingTime() {
    if (this.jobMetrics.processingTimes.length === 0) return 0;
    return Math.max(...this.jobMetrics.processingTimes);
  }

  getShortestProcessingTime() {
    if (this.jobMetrics.processingTimes.length === 0) return 0;
    return Math.min(...this.jobMetrics.processingTimes);
  }

  getUptime() {
    return Date.now() - this.startTime;
  }
}

export const metricsService = new MetricsService();

/**
 * Get queue statistics with details
 */
export const getQueueMetrics = async (queueName) => {
  try {
    const queue = createQueue(queueName);
    const counts = await queue.getJobCounts();
    const metrics = await queue.getJobCounts('active', 'completed', 'failed', 'delayed');

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0,
    };
  } catch (err) {
    logger.error('Failed to get queue metrics', { queueName, error: err.message });
    throw err;
  }
};

/**
 * Get Redis connection status and metrics
 */
export const getRedisMetrics = async () => {
  try {
    const redis = getRedisConnection();
    const info = await redis.info();
    const dbSize = await redis.dbsize();

    // Parse info string
    const lines = info.split('\r\n');
    const redisInfo = {};
    lines.forEach((line) => {
      const [key, value] = line.split(':');
      if (key && value) {
        redisInfo[key] = value;
      }
    });

    return {
      connected: redis.status === 'ready',
      status: redis.status,
      version: redisInfo.redis_version || 'unknown',
      memoryUsage: {
        human: redisInfo.used_memory_human || 'unknown',
        bytes: parseInt(redisInfo.used_memory || 0),
      },
      keys: dbSize,
      connectedClients: parseInt(redisInfo.connected_clients || 0),
      uptimeSeconds: parseInt(redisInfo.uptime_in_seconds || 0),
    };
  } catch (err) {
    logger.error('Failed to get Redis metrics', { error: err.message });
    return {
      connected: false,
      status: 'error',
      error: err.message,
    };
  }
};

/**
 * Get system health status
 */
export const getSystemHealth = async () => {
  try {
    const emailQueueMetrics = await getQueueMetrics(QUEUE_NAMES.email);
    const dlqMetrics = await getQueueMetrics(QUEUE_NAMES.emailDLQ);
    const redisMetrics = await getRedisMetrics();

    const totalJobs = Object.values(emailQueueMetrics).reduce((a, b) => a + b, 0);
    const failureRate =
      metricsService.jobMetrics.totalProcessed + metricsService.jobMetrics.totalFailed === 0
        ? 0
        : (metricsService.jobMetrics.totalFailed /
            (metricsService.jobMetrics.totalProcessed + metricsService.jobMetrics.totalFailed)) *
          100;

    return {
      timestamp: new Date().toISOString(),
      uptime: metricsService.getUptime(),
      system: {
        redis: redisMetrics,
        queues: {
          email: emailQueueMetrics,
          dlq: dlqMetrics,
        },
      },
      performance: {
        averageProcessingTime: metricsService.getAverageProcessingTime(),
        longestProcessingTime: metricsService.getLongestProcessingTime(),
        shortestProcessingTime: metricsService.getShortestProcessingTime(),
        jobsProcessed: metricsService.jobMetrics.totalProcessed,
        jobsFailed: metricsService.jobMetrics.totalFailed,
        jobsRetried: metricsService.jobMetrics.totalRetried,
        failureRate: Math.round(failureRate * 100) / 100,
      },
      health: {
        redis: redisMetrics.connected ? 'healthy' : 'unhealthy',
        queues: totalJobs === 0 ? 'healthy' : totalJobs > 100 ? 'degraded' : 'healthy',
        overall:
          redisMetrics.connected && totalJobs < 100 && failureRate < 0.5
            ? 'healthy'
            : 'degraded',
      },
    };
  } catch (err) {
    logger.error('Failed to get system health', { error: err.message });
    throw err;
  }
};

/**
 * Get job history for a queue
 */
export const getJobHistory = async (queueName, limit = 20) => {
  try {
    const queue = createQueue(queueName);

    // Get completed jobs
    const completed = await queue.getCompleted(0, limit - 1);
    const failed = await queue.getFailed(0, Math.floor(limit / 2) - 1);

    const history = [];

    for (const job of completed) {
      const state = await job.getState();
      const finishedTime = job.finishedOn || Date.now();
      const startedTime = job.startedOn || finishedTime;
      history.push({
        id: job.id,
        data: job.data,
        status: 'completed',
        attempts: job.attemptsMade || 1,
        progress: 100,
        startedOn: startedTime,
        finishedOn: finishedTime,
        executionTime: finishedTime - startedTime,
        createdAt: new Date(job.timestamp || Date.now()).toISOString(),
        type: job.data?.recipient ? 'email' : 'unknown',
      });
    }

    for (const job of failed) {
      const finishedTime = job.finishedOn || Date.now();
      history.push({
        id: job.id,
        data: job.data,
        status: 'failed',
        attempts: job.attemptsMade || 1,
        failedReason: job.failedReason || 'Unknown error',
        finishedOn: finishedTime,
        createdAt: new Date(job.timestamp || Date.now()).toISOString(),
        type: job.data?.recipient ? 'email' : 'unknown',
      });
    }

    // Sort by timestamp descending
    history.sort((a, b) => (b.finishedOn || 0) - (a.finishedOn || 0));

    return history.slice(0, limit);
  } catch (err) {
    logger.error('Failed to get job history', { queueName, error: err.message });
    throw err;
  }
};

export default {
  metricsService,
  getQueueMetrics,
  getRedisMetrics,
  getSystemHealth,
  getJobHistory,
};
