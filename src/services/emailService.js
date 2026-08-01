import { createQueue } from '../config/bullmq.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { logger } from '../utils/logger.js';

/**
 * Email Service
 * Orchestrates email job creation and management
 */

export const submitEmailJobs = async (recipients, subject, message) => {
  try {
    const queue = createQueue(QUEUE_NAMES.email);

    const jobPromises = recipients.map((recipient, index) => {
      // Generate simple alphanumeric jobId
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const jobId = `email${timestamp}${index}${random}`;

      return queue.add(
        {
          recipient,
          subject,
          message,
        },
        {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          jobId,
        }
      );
    });

    const jobs = await Promise.all(jobPromises);

    logger.info(`Email jobs submitted:`, {
      totalJobs: jobs.length,
      recipients: recipients.length,
      jobIds: jobs.map((job) => job.id),
    });

    return jobs;
  } catch (err) {
    logger.error('Failed to submit email jobs:', err);
    throw err;
  }
};

export const getEmailJobStatus = async (jobId) => {
  try {
    const queue = createQueue(QUEUE_NAMES.email);
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new Error(`Job [${jobId}] not found`);
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: job.id,
      recipient: job.data.recipient,
      subject: job.data.subject,
      status: state,
      progress,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      failedReason: job.failedReason,
    };
  } catch (err) {
    logger.error(`Failed to get email job status [${jobId}]:`, err);
    throw err;
  }
};

export const getEmailQueueStats = async () => {
  try {
    const queue = createQueue(QUEUE_NAMES.email);

    const counts = await queue.getJobCounts();

    return {
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
    };
  } catch (err) {
    logger.error('Failed to get email queue stats:', err);
    throw err;
  }
};

export default {
  submitEmailJobs,
  getEmailJobStatus,
  getEmailQueueStats,
};
