import { createQueue, createWorker } from '../config/bullmq.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { logger } from '../utils/logger.js';

/**
 * Email Processor
 * Simulates email sending with retry & Dead Letter Queue logic
 */

const simulateEmailSending = async (recipient, subject, message) => {
  // Simulate email sending (10% failure rate for demo purposes)
  const randomFailure = Math.random() < 0.1;

  if (randomFailure) {
    throw new Error(`Failed to send email to ${recipient}`);
  }

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    sent: true,
    recipient,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Move job to Dead Letter Queue
 */
const moveToDeadLetterQueue = async (job) => {
  try {
    const dlq = createQueue(QUEUE_NAMES.emailDLQ);

    const dlqJob = await dlq.add(
      {
        originalJobId: job.id,
        originalData: job.data,
        failedReason: job.failedReason,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        failedAt: new Date().toISOString(),
      },
      {
        removeOnComplete: false,
        removeOnFail: false,
        jobId: `dlq-${job.id}`,
      }
    );

    logger.warn(`Job moved to Dead Letter Queue:`, {
      originalJobId: job.id,
      dlqJobId: dlqJob.id,
      recipient: job.data.recipient,
    });

    return dlqJob;
  } catch (err) {
    logger.error(`Failed to move job to DLQ [${job.id}]:`, err);
    throw err;
  }
};

/**
 * Email processor function
 */
export const emailProcessor = async (job) => {
  try {
    const { recipient, subject, message } = job.data;

    logger.info(`Job started [${job.id}]:`, {
      recipient,
      subject,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
    });

    // Simulate email sending
    const result = await simulateEmailSending(recipient, subject, message);

    logger.info(`Job completed [${job.id}]:`, {
      recipient,
      result,
    });

    return result;
  } catch (err) {
    logger.warn(`Job failed [${job.id}]:`, {
      recipient: job.data.recipient,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
      error: err.message,
    });

    // Check if max retries exceeded
    if (job.attemptsMade >= job.opts.attempts - 1) {
      logger.error(`Job max retries exceeded [${job.id}], moving to DLQ:`, {
        recipient: job.data.recipient,
        attempts: job.attemptsMade + 1,
      });

      // Move to Dead Letter Queue
      await moveToDeadLetterQueue(job);
    }

    throw err;
  }
};

/**
 * Initialize email worker
 */
export const initializeEmailWorker = () => {
  const worker = createWorker(QUEUE_NAMES.email, emailProcessor);

  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info(`Worker: Job completed [${job.id}]: ${job.data.recipient}`);
  });

  worker.on('failed', (job, err) => {
    logger.warn(`Worker: Job failed [${job.id}]: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error('Worker error:', err);
  });

  logger.info('Email worker initialized for queue:', QUEUE_NAMES.email);
  return worker;
};

export default {
  emailProcessor,
  initializeEmailWorker,
};
