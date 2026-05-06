import { Request, Response, NextFunction } from 'express';
import * as sessionService from '../services/sessions.service';

export const startSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id; // From Auth Middleware
    const { routineId, notes } = req.body;
    const session = await sessionService.startNewSession(userId, routineId, notes);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const logSet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const { exerciseId, setNumber, logMode, loadKg, repCount, rpe } = req.body;
    const newSet = await sessionService.logSessionSet(
      sessionId as string, exerciseId, setNumber, logMode, loadKg, repCount, rpe
    );
    res.status(201).json(newSet);
  } catch (error) {
    next(error);
  }
};

export const endSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const session = await sessionService.finishSession(sessionId as string);
    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};