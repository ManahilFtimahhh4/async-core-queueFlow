import express from 'express';
import queueRoutes from './queue.js';

/**
 * Route Aggregator
 * Combines all route modules
 */

const router = express.Router();

router.use('/queue', queueRoutes);

export default router;
