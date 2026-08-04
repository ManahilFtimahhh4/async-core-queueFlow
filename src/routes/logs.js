import express from 'express';
import { getLogs } from '../controllers/logsController.js';

/**
 * Logs Routes
 */

const router = express.Router();

router.get('/', getLogs);

export default router;
