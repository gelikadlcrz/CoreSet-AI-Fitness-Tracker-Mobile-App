import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

// All analytics require an authenticated user
router.use(requireAuth);

// Get high-level workout summary (e.g., total workouts, calories burned)
router.get('/summary', analyticsController.getSummary);

// Get progress over time for charts/graphs
router.get('/progress', analyticsController.getProgress);

export default router;