import { Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/routines.repo';

export const createNewRoutine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { name, notes } = req.body;
    const routine = await repo.createRoutine(userId, name, notes);
    res.status(201).json(routine);
  } catch (error) { next(error); }
};

export const addRoutineExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const routineId = req.params.id;
    const { exerciseId, sortOrder, targetSets, targetRepsMin, targetRepsMax } = req.body;
    const exercise = await repo.addExerciseToRoutine(routineId as string, exerciseId, sortOrder, targetSets, targetRepsMin, targetRepsMax);
    res.status(201).json(exercise);
  } catch (error) { next(error); }
};