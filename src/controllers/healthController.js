import { getRedisMetrics, getSystemHealth } from '../services/metricsService.js';
import { getQueueMetrics } from '../services/metricsService.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Health Controller
 * Comprehensive health status with dependencies
 */

export const getDetailedHealth = async (req, res, next) => {
  try {
    const health = await getSystemHealth();
    const redisMetrics = await getRedisMetrics();
    const emailMetrics = await getQueueMetrics(QUEUE_NAMES.email);

    const response = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        status: health.health.overall,
        uptime: health.uptime,
        server: {
          status: 'healthy',
          environment: config.nodeEnv,
          version: process.env.npm_package_version || 'unknown',
          hostname: process.env.HOSTNAME || 'localhost',
        },
        redis: {
          status: redisMetrics.connected ? 'connected' : 'disconnected',
          version: redisMetrics.version,
          memory: redisMetrics.memoryUsage,
          keys: redisMetrics.keys,
        },
        queues: {
          status: health.health.queues,
          email: {
            ...emailMetrics,
            total: Object.values(emailMetrics).reduce((a, b) => a + b, 0),
          },
        },
        performance: {
          averageProcessingTime: health.performance.averageProcessingTime,
          jobsProcessed: health.performance.jobsProcessed,
          failureRate: health.performance.failureRate,
        },
      },
    };

    res.status(200).json(response);
  } catch (err) {
    logger.error('Health check failed', { error: err.message });
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: err.message,
      },
    });
  }
};

/**
 * Quick health check (lightweight)
 */
export const getQuickHealth = async (req, res, next) => {
  try {
    const health = await getSystemHealth();

    res.status(200).json({
      success: true,
      data: {
        status: health.health.overall,
        timestamp: health.timestamp,
        uptime: health.uptime,
      },
    });
  } catch (err) {
    logger.error('Quick health check failed', { error: err.message });
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
      },
    });
  }
};

export default {
  getDetailedHealth,
  getQuickHealth,
};
