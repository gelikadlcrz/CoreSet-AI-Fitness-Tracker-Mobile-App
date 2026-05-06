import { Router } from 'express';
import * as sessionController from '../controllers/sessions.controller';
import * as repsController from '../controllers/reps.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to ALL session routes
router.use(authenticateToken);

router.post('/', sessionController.startSession);
router.post('/:id/sets', sessionController.logSet);
router.put('/:id/end', sessionController.endSession);
router.post('/sets/:setId/reps', repsController.logSingleRep);

export default router;