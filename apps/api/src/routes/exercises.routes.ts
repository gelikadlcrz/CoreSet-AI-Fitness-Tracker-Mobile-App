import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import * as exerciseController from '../controllers/exercises.controller';

const router = Router();

// Apply auth middleware to all exercise routes
router.use(requireAuth);

router.get('/', exerciseController.getAllExercises);
router.post('/', exerciseController.createExercise);
router.get('/:id', exerciseController.getExerciseById);
router.put('/:id', exerciseController.updateExercise);
router.delete('/:id', exerciseController.deleteExercise);

export default router;