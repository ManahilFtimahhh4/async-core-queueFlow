import { createQueue, createWorker } from '../config/bullmq.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * Email Processor with Production Features
 * Full lifecycle: progress tracking, error handling, DLQ management
 */

const getRandomDelay = (min, max) => Math.random() * (max - min) + min;

const simulateEmailSending = async (job) => {
  const { recipient, subject, message } = job.data;
  const isDevelopment = config.isDevelopment;

  // Development mode: realistic simulations
  if (isDevelopment) {
    // Random failure rate: 15% in dev for demo purposes
    const shouldFail = Math.random() < 0.15;
    
    if (shouldFail) {
      throw new Error(`Simulated failure: Failed to send email to ${recipient}`);
    }

    // Random processing delay: 300-1000ms in dev
    const delay = getRandomDelay(300, 1000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  } else {
    // Production mode: minimal processing time
    const delay = getRandomDelay(100, 300);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return {
    sent: true,
    recipient,
    subject,
    messageSize: message?.length || 0,
    timestamp: new Date().toISOString(),
    processingTime: Date.now() - job.startedOn,
  };
};

const moveToDeadLetterQueue = async (job, reason) => {
  try {
    const dlq = createQueue(QUEUE_NAMES.emailDLQ);

    const dlqJob = await dlq.add(
      {
        originalJobId: job.id,
        originalData: job.data,
        failedReason: reason,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        failedAt: new Date().toISOString(),
        createdAt: new Date(job.timestamp).toISOString(),
      },
      {
        removeOnComplete: false,
        removeOnFail: false,
        jobId: `dlq${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      }
    );

    logger.warn(`Job moved to DLQ`, {
      originalJobId: job.id,
      dlqJobId: dlqJob.id,
      recipient: job.data.recipient,
      reason,
    });

    return dlqJob;
  } catch (err) {
    logger.error(`Failed to move job to DLQ`, { jobId: job.id, error: err.message });
    throw err;
  }
};

export const emailProcessor = async (job) => {
  const startTime = Date.now();
  const { recipient } = job.data;

  try {
    // Progress: Queued (5%)
    try {
      await job.updateProgress(5);
    } catch (err) {
      logger.debug(`Progress update failed at 5%`, { error: err.message });
    }

    logger.info(`Job started`, {
      jobId: job.id,
      recipient,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
    });

    // Progress: Processing (25%)
    try {
      await job.updateProgress(25);
    } catch (err) {
      logger.debug(`Progress update failed at 25%`, { error: err.message });
    }

    // Simulate email sending
    const result = await simulateEmailSending(job);

    // Progress: Finalizing (75%)
    try {
      await job.updateProgress(75);
    } catch (err) {
      logger.debug(`Progress update failed at 75%`, { error: err.message });
    }

    // Progress: Complete (100%)
    try {
      await job.updateProgress(100);
    } catch (err) {
      logger.debug(`Progress update failed at 100%`, { error: err.message });
    }

    const executionTime = Date.now() - startTime;

    logger.info(`Job completed`, {
      jobId: job.id,
      recipient,
      executionTime,
      result,
    });

    return {
      success: true,
      recipient,
      executionTime,
      sentAt: new Date().toISOString(),
      ...result,
    };
  } catch (err) {
    const executionTime = Date.now() - startTime;
    const isLastAttempt = job.attemptsMade >= job.opts.attempts - 1;

    logger.warn(`Job failed`, {
      jobId: job.id,
      recipient,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
      executionTime,
      error: err.message,
      willRetry: !isLastAttempt,
    });

    // Move to DLQ if max retries exceeded
    if (isLastAttempt) {
      logger.error(`Job max retries exceeded`, {
        jobId: job.id,
        recipient,
        totalAttempts: job.attemptsMade + 1,
        totalExecutionTime: Date.now() - job.timestamp,
      });

      await moveToDeadLetterQueue(job, err.message);
    }

    throw err;
  }
};

export const initializeEmailWorker = () => {
  const worker = createWorker(QUEUE_NAMES.email, emailProcessor, {
    settings: {
      stalledInterval: 5000,
      maxStalledCount: 2,
      lockDuration: 30000,
      lockRenewTime: 15000,
    },
  });

  worker.on('progress', (job, progress) => {
    logger.debug(`Job progress`, {
      jobId: job.id,
      progress: `${progress}%`,
      recipient: job.data.recipient,
    });
  });

  worker.on('completed', (job, result) => {
    logger.info(`Worker: Job completed`, {
      jobId: job.id,
      recipient: job.data.recipient,
      executionTime: result?.executionTime,
    });
  });

  worker.on('failed', (job, err) => {
    logger.warn(`Worker: Job failed`, {
      jobId: job.id,
      recipient: job.data.recipient,
      error: err.message,
      attempt: job.attemptsMade + 1,
    });
  });

  worker.on('error', (err) => {
    logger.error(`Worker error`, { error: err.message });
  });

  logger.info(`Email worker initialized`, { queueName: QUEUE_NAMES.email });
  return worker;
};

export default {
  emailProcessor,
  initializeEmailWorker,
};
