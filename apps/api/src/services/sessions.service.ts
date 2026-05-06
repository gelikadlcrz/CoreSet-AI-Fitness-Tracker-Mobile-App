import * as sessionRepo from '../repositories/sessions.repo';
import * as setsRepo from '../repositories/sets.repo';

export const startNewSession = async (userId: string, routineId?: string, notes?: string) => {
  return await sessionRepo.createSession(userId, routineId, notes);
};

export const logSessionSet = async (
  sessionId: string, 
  exerciseId: string, 
  setNumber: number, 
  logMode: 'ai' | 'manual', 
  loadKg: number, 
  repCount: number, 
  rpe?: number
) => {
  return await setsRepo.createSet(sessionId, exerciseId, setNumber, logMode, loadKg, repCount, rpe);
};

export const finishSession = async (sessionId: string) => {
  return await sessionRepo.completeSession(sessionId);
};