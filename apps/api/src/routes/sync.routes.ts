import { Router } from 'express';
import * as syncController from '../controllers/sync.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken); // Must be logged in to sync

router.get('/', syncController.pull);
router.post('/', syncController.push);

export default router;