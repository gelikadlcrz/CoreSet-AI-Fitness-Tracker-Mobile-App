import { Request, Response, NextFunction } from 'express';
import * as syncService from '../services/sync.service';

export const pull = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId      = (req as any).user.id;
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

    if (!changes || typeof lastPulledAt !== 'number') {
      return res.status(400).json({ error: 'Missing changes or lastPulledAt' });
    }

    await syncService.pushChanges(userId, changes, lastPulledAt);
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
};