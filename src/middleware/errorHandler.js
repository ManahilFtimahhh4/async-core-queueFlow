import { logger } from '../utils/logger.js';

/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent error responses
 */

export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Request error:', {
    status,
    message,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(status).json({
    success: false,
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * 404 Handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      status: 404,
      message: `Route not found: ${req.method} ${req.path}`,
    },
  });
};

export default errorHandler;
