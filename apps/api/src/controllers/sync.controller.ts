import { Request, Response, NextFunction } from 'express';
import * as syncService from '../services/sync.service';

export const pull = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    // WatermelonDB passes lastPulledAt as a query parameter
    const lastPulledAt = parseInt(req.query.lastPulledAt as string) || 0;
    
    const pullData = await syncService.pullChanges(userId, lastPulledAt);
    res.status(200).json(pullData);
  } catch (error) {
    next(error);
  }
};

export const push = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { changes, lastPulledAt } = req.body;

    await syncService.pushChanges(userId, changes, lastPulledAt);
    res.status(200).send('Sync push successful');
  } catch (error) {
    next(error);
  }
};