import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/users.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body;
    if (!displayName) return res.status(400).json({ error: 'displayName is required' });
    
    const user = await userService.registerUser(email, password, displayName);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id; 
    const profile = await userService.getUserProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id; 
    const updatedProfile = await userService.updateUserProfile(userId, req.body);
    res.status(200).json(updatedProfile);
  } catch (error) {
    next(error);
  }
};