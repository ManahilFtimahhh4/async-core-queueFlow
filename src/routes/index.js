import express from 'express';
import queueRoutes from './queue.js';
import emailRoutes from './email.js';
import dashboardRoutes from './dashboard.js';

/**
 * Route Aggregator
 * Combines all route modules
 */

const router = express.Router();

router.use('/queue', queueRoutes);
router.use('/jobs/email', emailRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
