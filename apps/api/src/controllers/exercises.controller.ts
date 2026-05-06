import { Request, Response, NextFunction } from 'express';
import * as exerciseService from '../services/exercises.service';

export const getAllExercises = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exercises = await exerciseService.fetchAllExercises();
    res.status(200).json(exercises);
  } catch (error) {
    next(error);
  }
};

export const createExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, primaryMuscle, equipmentType } = req.body;
    const newExercise = await exerciseService.createNewExercise(name, primaryMuscle, equipmentType);
    res.status(201).json(newExercise);
  } catch (error) {
    next(error);
  }
};

export const getExerciseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exercise = await exerciseService.fetchExerciseById(req.params.id as string);
    res.status(200).json(exercise);
  } catch (error) {
    next(error);
  }
};

export const updateExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await exerciseService.modifyExercise(req.params.id as string, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await exerciseService.removeExercise(req.params.id as string);
    res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    next(error);
  }
};