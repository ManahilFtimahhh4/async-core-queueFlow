import {
  getQueueMetrics,
  getRedisMetrics,
  getSystemHealth,
  getJobHistory,
} from '../services/metricsService.js';
import { createQueue } from '../config/bullmq.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { logger } from '../utils/logger.js';

/**
 * Dashboard Controller
 * Provides monitoring and metrics endpoints for the dashboard
 */

export const getDashboardOverview = async (req, res, next) => {
  try {
    const health = await getSystemHealth();

    res.status(200).json({
      success: true,
      data: {
        timestamp: health.timestamp,
        uptime: health.uptime,
        system: health.system,
        performance: health.performance,
        health: health.health,
      },
    });
  } catch (err) {
    logger.error('Dashboard overview failed', { error: err.message });
    next(err);
  }
};

export const getQueueOverview = async (req, res, next) => {
  try {
    const emailMetrics = await getQueueMetrics(QUEUE_NAMES.email);
    const dlqMetrics = await getQueueMetrics(QUEUE_NAMES.emailDLQ);

    res.status(200).json({
      success: true,
      data: {
        email: {
          ...emailMetrics,
          total: Object.values(emailMetrics).reduce((a, b) => a + b, 0),
        },
        dlq: dlqMetrics,
      },
    });
  } catch (err) {
    logger.error('Queue overview failed', { error: err.message });
    next(err);
  }
};

export const getRedisStatus = async (req, res, next) => {
  try {
    const redisMetrics = await getRedisMetrics();

    res.status(200).json({
      success: true,
      data: redisMetrics,
    });
  } catch (err) {
    logger.error('Redis status failed', { error: err.message });
    next(err);
  }
};

export const getJobHistoryEndpoint = async (req, res, next) => {
  try {
    const { limit = 20, queue = QUEUE_NAMES.email } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);

    if (!Object.values(QUEUE_NAMES).includes(queue)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid queue name. Allowed: ${Object.values(QUEUE_NAMES).join(', ')}`,
        },
      });
    }

    const history = await getJobHistory(queue, parsedLimit);

    res.status(200).json({
      success: true,
      data: {
        queue,
        limit: parsedLimit,
        count: history.length,
        jobs: history,
      },
    });
  } catch (err) {
    logger.error('Job history failed', { error: err.message });
    next(err);
  }
};

export const getPerformanceMetrics = async (req, res, next) => {
  try {
    const health = await getSystemHealth();

    const metrics = {
      processing: {
        averageMs: health.performance.averageProcessingTime,
        longestMs: health.performance.longestProcessingTime,
        shortestMs: health.performance.shortestProcessingTime,
      },
      counts: {
        processed: health.performance.jobsProcessed,
        failed: health.performance.jobsFailed,
        retried: health.performance.jobsRetried,
      },
      rates: {
        failureRate: health.performance.failureRate,
        successRate: 100 - health.performance.failureRate,
      },
    };

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    logger.error('Performance metrics failed', { error: err.message });
    next(err);
  }
};

export const getDLQJobs = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);

    const dlqHistory = await getJobHistory(QUEUE_NAMES.emailDLQ, parsedLimit);

    res.status(200).json({
      success: true,
      data: {
        queue: QUEUE_NAMES.emailDLQ,
        count: dlqHistory.length,
        jobs: dlqHistory,
      },
    });
  } catch (err) {
    logger.error('DLQ jobs failed', { error: err.message });
    next(err);
  }
};

export default {
  getDashboardOverview,
  getQueueOverview,
  getRedisStatus,
  getJobHistoryEndpoint,
  getPerformanceMetrics,
  getDLQJobs,
};
