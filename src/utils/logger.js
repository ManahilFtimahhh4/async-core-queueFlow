import { config } from '../config/env.js';

/**
 * Centralized Logger
 * Provides structured logging with levels and context
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getCurrentLevel = () => {
  return LOG_LEVELS[config.app.logLevel] || LOG_LEVELS.info;
};

const formatTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message, data = null) => {
  const timestamp = formatTimestamp();
  const levelUpper = level.toUpperCase().padEnd(6);

  if (data) {
    return `[${timestamp}] ${levelUpper} ${message} ${JSON.stringify(data)}`;
  }
  return `[${timestamp}] ${levelUpper} ${message}`;
};

export const logger = {
  debug: (message, data) => {
    if (LOG_LEVELS.debug >= getCurrentLevel()) {
      console.log(formatMessage('debug', message, data));
    }
  },

  info: (message, data) => {
    if (LOG_LEVELS.info >= getCurrentLevel()) {
      console.log(formatMessage('info', message, data));
    }
  },

  warn: (message, data) => {
    if (LOG_LEVELS.warn >= getCurrentLevel()) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  error: (message, data) => {
    if (LOG_LEVELS.error >= getCurrentLevel()) {
      console.error(formatMessage('error', message, data));
    }
  },
};

export default logger;
