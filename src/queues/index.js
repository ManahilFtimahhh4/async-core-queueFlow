/**
 * Queue Registry
 * Central registry for all queue names
 */

export const QUEUE_NAMES = {
  email: 'email-queue',
  emailDLQ: 'email-dlq', // Dead Letter Queue
};

export default QUEUE_NAMES;
