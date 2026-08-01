import { getQueue } from '../config/bullmq.js';
import { logger } from '../utils/logger.js';

/**
 * Queue Service
 * Business logic for queue operations
 * This layer sits between controllers and BullMQ
 */

export const submitJob = async (queueName, jobData, options = {}) => {
  try {
    const queue = getQueue(queueName);

    const job = await queue.add(jobData, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      ...options,
    });

    logger.info(`Job submitted to queue [${queueName}]:`, { jobId: job.id });
    return job;
  } catch (err) {
    logger.error(`Failed to submit job to queue [${queueName}]:`, err);
    throw err;
  }
};

export const getJobStatus = async (queueName, jobId) => {
  try {
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new Error(`Job [${jobId}] not found in queue [${queueName}]`);
    }

    return {
      id: job.id,
      data: job.data,
      status: await job.getState(),
      progress: job.progress(),
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    };
  } catch (err) {
    logger.error(`Failed to get job status [${jobId}]:`, err);
    throw err;
  }
};

export default {
  submitJob,
  getJobStatus,
};
