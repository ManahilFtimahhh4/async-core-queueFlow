import { submitEmailJobs, getEmailJobStatus, getEmailQueueStats } from '../services/emailService.js';
import { createQueue } from '../config/bullmq.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { logger } from '../utils/logger.js';

/**
 * Email Controller
 * Handles HTTP requests for email jobs
 */

export const submitEmails = async (req, res, next) => {
  try {
    const { recipients, subject, message } = req.body;

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Recipients must be a non-empty array',
        },
      });
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Subject is required and must be a non-empty string',
        },
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message is required and must be a non-empty string',
        },
      });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid email addresses: ${invalidEmails.join(', ')}`,
        },
      });
    }

    // Submit jobs (one per recipient)
    const jobs = await submitEmailJobs(recipients, subject, message);

    logger.info(`Email submission successful`, {
      totalJobs: jobs.length,
      recipients: recipients.length,
    });

    res.status(202).json({
      success: true,
      message: 'Jobs queued successfully',
      data: {
        totalJobs: jobs.length,
        jobIds: jobs.map((job) => job.id),
        recipients: recipients.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error('Email submission failed', { error: err.message });
    next(err);
  }
};

export const getJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Job ID is required',
        },
      });
    }

    const jobStatus = await getEmailJobStatus(jobId);

    res.status(200).json({
      success: true,
      data: jobStatus,
    });
  } catch (err) {
    logger.error(`Get job status failed`, { jobId: req.params.jobId, error: err.message });

    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          message: err.message,
        },
      });
    }

    next(err);
  }
};

export const getQueueStats = async (req, res, next) => {
  try {
    const stats = await getEmailQueueStats();

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        total: Object.values(stats).reduce((a, b) => a + b, 0),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error('Get queue stats failed', { error: err.message });
    next(err);
  }
};

export default {
  submitEmails,
  getJobStatus,
  getQueueStats,
};

export const retryJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Job ID is required',
        },
      });
    }

    // Get the job from DLQ or regular queue
    const queue = createQueue(QUEUE_NAMES.email);
    const dlq = createQueue(QUEUE_NAMES.emailDLQ);
    
    let job = await queue.getJob(jobId);
    let fromDLQ = false;
    
    if (!job) {
      job = await dlq.getJob(jobId);
      fromDLQ = true;
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Job ${jobId} not found in queue or DLQ`,
        },
      });
    }

    // If from DLQ, need to extract original data
    let jobData = job.data;
    if (fromDLQ && job.data.originalData) {
      jobData = job.data.originalData;
    }

    // Create new job in main queue with reset attempts
    const newJob = await queue.add(jobData, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    logger.info(`Job retry initiated`, {
      originalJobId: jobId,
      newJobId: newJob.id,
      fromDLQ,
    });

    res.status(202).json({
      success: true,
      message: 'Job retry initiated',
      data: {
        originalJobId: jobId,
        newJobId: newJob.id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error(`Retry job failed`, { jobId: req.params.jobId, error: err.message });
    next(err);
  }
};
