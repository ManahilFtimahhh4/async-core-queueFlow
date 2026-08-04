import express from 'express';
import { getJobDetails, getFailedJobs, getAllJobs } from '../controllers/jobsController.js';

/**
 * Jobs Routes
 * Extended job endpoints
 */

const router = express.Router();

router.get('/all', getAllJobs);
router.get('/failed', getFailedJobs);
router.get('/:jobId/details', getJobDetails);

export default router;
