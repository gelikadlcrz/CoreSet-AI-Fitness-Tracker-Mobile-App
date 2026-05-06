import { Router } from 'express';
import * as routinesController from '../controllers/routines.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateToken);

router.post('/', routinesController.createNewRoutine);
router.post('/:id/exercises', routinesController.addRoutineExercise);

export default router;