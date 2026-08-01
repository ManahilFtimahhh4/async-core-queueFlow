import { v4 as uuidv4 } from 'uuid';

/**
 * Utility Helper Functions
 */

export const generateId = () => uuidv4();

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryAsync = async (fn, maxAttempts = 3, delayMs = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await wait(delayMs * attempt);
      }
    }
  }

  throw lastError;
};

export const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (Number.isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

export default {
  generateId,
  wait,
  retryAsync,
  normalizePort,
};
