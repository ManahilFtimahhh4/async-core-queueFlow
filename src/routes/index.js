import express from 'express';
import queueRoutes from './queue.js';
import emailRoutes from './email.js';

/**
 * Route Aggregator
 * Combines all route modules
 */

const router = express.Router();

router.use('/queue', queueRoutes);
router.use('/jobs/email', emailRoutes);

export default router;
