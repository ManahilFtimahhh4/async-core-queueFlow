import express from 'express';
import {
  getDashboardOverview,
  getQueueOverview,
  getRedisStatus,
  getJobHistoryEndpoint,
  getPerformanceMetrics,
  getDLQJobs,
} from '../controllers/dashboardController.js';

/**
 * Dashboard Routes
 * Monitoring and metrics endpoints
 */

const router = express.Router();

// Overview dashboard
router.get('/overview', getDashboardOverview);

// Queue metrics
router.get('/queues', getQueueOverview);

// Redis status
router.get('/redis', getRedisStatus);

// Job history
router.get('/history', getJobHistoryEndpoint);

// Performance metrics
router.get('/metrics', getPerformanceMetrics);

// Dead Letter Queue jobs
router.get('/dlq', getDLQJobs);

export default router;
