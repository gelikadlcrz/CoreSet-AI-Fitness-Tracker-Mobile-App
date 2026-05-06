import { Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/reps.repo';

export const logSingleRep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setId = req.params.setId;
    const { repNumber, eccentricS, concentricS, displacementM, velocity, confidence } = req.body;
    const rep = await repo.logRep(setId as string, repNumber, eccentricS, concentricS, displacementM, velocity, confidence);
    res.status(201).json(rep);
  } catch (error) { next(error); }
};