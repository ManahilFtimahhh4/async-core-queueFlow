import { submitEmailJobs, getEmailJobStatus, getEmailQueueStats } from '../services/emailService.js';
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

    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Subject is required and must be a string',
        },
      });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message is required and must be a string',
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
