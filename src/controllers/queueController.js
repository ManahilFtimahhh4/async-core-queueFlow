import { logger } from '../utils/logger.js';

/**
 * Queue Controller
 * Handles HTTP requests related to queue operations
 */

export const getHealthStatus = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        service: 'Async Core Queue',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getQueueStats = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        message: 'Use GET /api/dashboard/queues for detailed queue statistics',
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getHealthStatus,
  getQueueStats,
};
