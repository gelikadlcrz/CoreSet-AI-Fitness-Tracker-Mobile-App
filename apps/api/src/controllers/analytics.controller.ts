import { Request, Response, NextFunction } from 'express';

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ message: 'High-level workout summary data (Controller Stub)' });
  } catch (error) {
    next(error);
  }
};

export const getProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ message: 'Progress over time data (Controller Stub)' });
  } catch (error) {
    next(error);
  }
};