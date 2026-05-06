import { Router } from 'express';
import * as metricsController from '../controllers/bodyMetrics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateToken); // Protect all metric routes

router.post('/', metricsController.logUserMetrics);
router.get('/', metricsController.getUserMetrics);

export default router;