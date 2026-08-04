import { logger } from '../utils/logger.js';

/**
 * Logs Controller
 * Provides system and worker logs
 */

// In-memory log store (for MVP - would use database in production)
let logs = [];
const MAX_LOGS = 500;

export const recordLog = (level, message, data = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  logs.unshift(logEntry);
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(0, MAX_LOGS);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const { level, limit = 50, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
    const parsedOffset = parseInt(offset, 10) || 0;

    let filteredLogs = logs;

    if (level && level !== 'all') {
      filteredLogs = logs.filter(log => log.level.toUpperCase() === level.toUpperCase());
    }

    const total = filteredLogs.length;
    const slicedLogs = filteredLogs.slice(parsedOffset, parsedOffset + parsedLimit);

    res.status(200).json({
      success: true,
      data: {
        logs: slicedLogs,
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total,
      },
    });
  } catch (err) {
    logger.error('Failed to get logs', { error: err.message });
    next(err);
  }
};

export default {
  recordLog,
  getLogs,
};
