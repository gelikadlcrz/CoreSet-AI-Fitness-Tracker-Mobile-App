import { Request, Response, NextFunction } from 'express';

export const pushChanges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Process incoming WatermelonDB sync payload
    res.status(200).json({ message: 'Local mobile data synced to server (Controller Stub)' });
  } catch (error) {
    next(error);
  }
};

export const pullChanges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch new changes from PostgreSQL since the provided timestamp
    res.status(200).json({ message: 'Server data sent to mobile app (Controller Stub)' });
  } catch (error) {
    next(error);
  }
};