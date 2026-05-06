import { Router } from 'express';
import * as userController from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware'; // Import it!

const router = Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Private route
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);

export default router;