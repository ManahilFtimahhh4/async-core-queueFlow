/**
 * Validation Utilities
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateJobPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be an object' };
  }
  return { valid: true };
};

export const validateQueueName = (name) => {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { valid: false, error: 'Queue name must be a non-empty string' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { valid: false, error: 'Queue name must contain only alphanumeric characters, hyphens, and underscores' };
  }
  return { valid: true };
};

export default {
  validateEmail,
  validateJobPayload,
  validateQueueName,
};
