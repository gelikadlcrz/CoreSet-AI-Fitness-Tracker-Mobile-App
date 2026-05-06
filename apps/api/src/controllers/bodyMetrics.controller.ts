import { Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/bodyMetrics.repo';

export const logUserMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { bodyweightKg, bodyFatPct, notes } = req.body;
    const metric = await repo.logMetric(userId, bodyweightKg, bodyFatPct, notes);
    res.status(201).json(metric);
  } catch (error) { next(error); }
};

export const getUserMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const metrics = await repo.getMetricsByUser(userId);
    res.status(200).json(metrics);
  } catch (error) { next(error); }
};