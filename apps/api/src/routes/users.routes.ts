import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import * as userController from '../controllers/users.controller';

const router = Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);

export default router;