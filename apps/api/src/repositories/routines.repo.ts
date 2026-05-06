import { pool } from '../config/db';

export const createRoutine = async (userId: string, name: string, notes?: string) => {
  const result = await pool.query(
    'INSERT INTO routines (user_id, name, notes) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, notes || null]
  );
  return result.rows[0];
};

export const addExerciseToRoutine = async (
  routineId: string, exerciseId: string, sortOrder: number, 
  targetSets: number, targetRepsMin: number, targetRepsMax: number
) => {
  const result = await pool.query(
    `INSERT INTO routine_exercises 
     (routine_id, exercise_id, sort_order, target_sets, target_reps_min, target_reps_max) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [routineId, exerciseId, sortOrder, targetSets, targetRepsMin, targetRepsMax]
  );
  return result.rows[0];
};

export const getRoutinesByUser = async (userId: string) => {
  const result = await pool.query('SELECT * FROM routines WHERE user_id = $1 AND deleted_at IS NULL', [userId]);
  return result.rows;
};