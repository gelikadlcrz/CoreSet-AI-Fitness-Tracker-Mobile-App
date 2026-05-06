import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import * as syncController from '../controllers/sync.controller';

const router = Router();

// Apply auth middleware to all sync operations
router.use(requireAuth);

// Mobile app sends local offline changes to the server
router.post('/push', syncController.pushChanges);

// Mobile app requests new changes from the server since last sync timestamp
router.get('/pull', syncController.pullChanges);

export default router;