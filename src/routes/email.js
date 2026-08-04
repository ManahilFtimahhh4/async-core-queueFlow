import express from 'express';
import { submitEmails, getJobStatus, getQueueStats, retryJob } from '../controllers/emailController.js';

/**
 * Email Routes
 * Endpoints for email job management
 */

const router = express.Router();

// Submit email jobs (one per recipient)
router.post('/jobs', submitEmails);

// Get status of a specific job
router.get('/jobs/:jobId', getJobStatus);

// Retry a job
router.post('/jobs/:jobId/retry', retryJob);

// Get queue statistics
router.get('/stats', getQueueStats);

export default router;
