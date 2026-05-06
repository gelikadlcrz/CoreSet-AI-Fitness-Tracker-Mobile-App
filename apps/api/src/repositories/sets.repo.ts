import { pool } from '../config/db';

export const createSet = async (
  sessionId: string, 
  exerciseId: string, 
  setNumber: number, 
  logMode: 'ai' | 'manual', 
  loadKg?: number, 
  repCount?: number, 
  rpe?: number
) => {
  const result = await pool.query(
    `INSERT INTO sets 
    (session_id, exercise_id, set_number, log_mode, load_kg, rep_count, rpe) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [sessionId, exerciseId, setNumber, logMode, loadKg || null, repCount || null, rpe || null]
  );
  return result.rows[0];
};

export const getSetsBySession = async (sessionId: string) => {
  const result = await pool.query(
    'SELECT * FROM sets WHERE session_id = $1 AND deleted_at IS NULL ORDER BY set_number ASC',
    [sessionId]
  );
  return result.rows;
};

export const updateSet = async (
  setId: string, 
  loadKg?: number, 
  repCount?: number, 
  rpe?: number
) => {
  const result = await pool.query(
    `UPDATE sets 
     SET load_kg = COALESCE($1, load_kg), 
         rep_count = COALESCE($2, rep_count), 
         rpe = COALESCE($3, rpe) 
     WHERE set_id = $4 AND deleted_at IS NULL 
     RETURNING *`,
    [loadKg || null, repCount || null, rpe || null, setId]
  );
  return result.rows[0];
};

export const deleteSet = async (setId: string) => {
  // Soft delete to preserve historical AI data
  const result = await pool.query(
    'UPDATE sets SET deleted_at = CURRENT_TIMESTAMP WHERE set_id = $1 RETURNING set_id',
    [setId]
  );
  return result.rows[0];
};