import express from 'express';
import queueRoutes from './queue.js';
import emailRoutes from './email.js';
import dashboardRoutes from './dashboard.js';
import jobsRoutes from './jobs.js';
import logsRoutes from './logs.js';

/**
 * Route Aggregator
 * Combines all route modules
 */

const router = express.Router();

router.use('/queue', queueRoutes);
router.use('/jobs/email', emailRoutes);
router.use('/jobs', jobsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/logs', logsRoutes);

export default router;
