import express from 'express';
import { getHealthStatus, getQueueStats } from '../controllers/queueController.js';

/**
 * Queue Routes
 * Endpoints for queue operations
 */

const router = express.Router();

router.get('/health', getHealthStatus);
router.get('/stats', getQueueStats);

export default router;
