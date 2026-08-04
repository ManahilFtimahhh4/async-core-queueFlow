import { createQueue } from '../config/bullmq.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { logger } from '../utils/logger.js';

/**
 * Jobs Controller
 * Extended job management endpoints
 */

export const getJobDetails = async (req, res, next) => {
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

    const queue = createQueue(QUEUE_NAMES.email);
    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Job ${jobId} not found`,
        },
      });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.status(200).json({
      success: true,
      data: {
        id: job.id,
        data: job.data,
        state,
        progress,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        createdAt: new Date(job.timestamp || Date.now()).toISOString(),
        startedOn: job.startedOn ? new Date(job.startedOn).toISOString() : null,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        result: job.returnvalue,
      },
    });
  } catch (err) {
    logger.error('Failed to get job details', { jobId: req.params.jobId, error: err.message });
    next(err);
  }
};

export const getFailedJobs = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);

    const queue = createQueue(QUEUE_NAMES.email);
    const failedJobs = await queue.getFailed(0, parsedLimit - 1);

    const jobs = [];
    for (const job of failedJobs) {
      jobs.push({
        id: job.id,
        data: job.data,
        status: 'failed',
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        createdAt: new Date(job.timestamp || Date.now()).toISOString(),
        type: job.data?.recipient ? 'email' : 'unknown',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        jobs,
        count: jobs.length,
        limit: parsedLimit,
      },
    });
  } catch (err) {
    logger.error('Failed to get failed jobs', { error: err.message });
    next(err);
  }
};

export const getAllJobs = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);

    const queue = createQueue(QUEUE_NAMES.email);

    // Get jobs from all states
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(0, parsedLimit - 1),
      queue.getActive(0, parsedLimit - 1),
      queue.getCompleted(0, parsedLimit - 1),
      queue.getFailed(0, parsedLimit - 1),
      queue.getDelayed(0, parsedLimit - 1),
    ]);

    const jobs = [];
    const addJobs = (jobArray, status) => {
      jobArray.forEach(job => {
        jobs.push({
          id: job.id,
          data: job.data,
          status,
          attempts: job.attemptsMade,
          maxAttempts: job.opts.attempts,
          progress: status === 'active' ? job.progress() || 0 : (status === 'completed' ? 100 : 0),
          createdAt: new Date(job.timestamp || Date.now()).toISOString(),
          type: job.data?.recipient ? 'email' : 'unknown',
        });
      });
    };

    addJobs(waiting, 'waiting');
    addJobs(active, 'active');
    addJobs(completed, 'completed');
    addJobs(failed, 'failed');
    addJobs(delayed, 'delayed');

    res.status(200).json({
      success: true,
      data: {
        jobs,
        count: jobs.length,
        limit: parsedLimit,
      },
    });
  } catch (err) {
    logger.error('Failed to get all jobs', { error: err.message });
    next(err);
  }
};

export default {
  getJobDetails,
  getFailedJobs,
  getAllJobs,
};
