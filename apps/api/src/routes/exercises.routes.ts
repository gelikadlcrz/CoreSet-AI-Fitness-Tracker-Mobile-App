import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as exerciseController from '../controllers/exercises.controller';

const router = Router();

// Apply auth middleware to all exercise routes
router.use(authenticateToken);

router.get('/', exerciseController.getAllExercises);
router.post('/', exerciseController.createExercise);
router.get('/:id', exerciseController.getExerciseById);
router.put('/:id', exerciseController.updateExercise);
router.delete('/:id', exerciseController.deleteExercise);

export default router;