import 'dotenv/config.js';

/**
 * Environment Validation & Configuration
 * Ensures all critical environment variables are set at startup
 * Variables with defaults are optional
 */

// Critical variables that must be explicitly set (no defaults)
const REQUIRED_ENV_VARS = [
  'NODE_ENV',
];

// Variables that should be set, with fallback defaults
const CRITICAL_VARS_WITH_DEFAULTS = {
  PORT: '3000',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
};

const validateEnv = () => {
  // Check for critical variables without defaults
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'See .env.example for configuration template'
    );
  }

  // Warn about critical variables that fall back to defaults
  const usingDefaults = [];
  Object.entries(CRITICAL_VARS_WITH_DEFAULTS).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      usingDefaults.push(`${key} (using default: ${defaultValue})`);
    }
  });

  if (usingDefaults.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Critical variables missing in production: ${usingDefaults.join(', ')}\n` +
      'In production, all critical variables must be explicitly set.'
    );
  }

  if (usingDefaults.length > 0 && process.env.NODE_ENV === 'development') {
    // Silent fallback in development (defaults are acceptable)
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
