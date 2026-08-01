import 'dotenv/config.js';

/**
 * Environment Validation & Configuration
 * Ensures all required environment variables are set at startup
 */

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'REDIS_HOST',
  'REDIS_PORT',
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'See .env.example for configuration template'
    );
  }
};

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Redis
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // BullMQ
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    maxAttempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS || '3', 10),
    backoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '5000', 10),
  },

  // Email (Nodemailer)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@asynccore.dev',
  },

  // Application
  app: {
    name: process.env.APP_NAME || 'Async Core',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

// Validate on module load
validateEnv();

export default config;
