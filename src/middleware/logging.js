import morgan from 'morgan';
import { config } from '../config/env.js';

/**
 * HTTP Request Logging Middleware
 */

const morganFormat = config.isDevelopment
  ? 'dev'
  : 'combined';

export const loggingMiddleware = morgan(morganFormat);

export default loggingMiddleware;
