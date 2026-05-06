import { pool } from '../config/db';

export const createSession = async (userId: string, routineId?: string, notes?: string) => {
  const result = await pool.query(
    'INSERT INTO sessions (user_id, routine_id, notes) VALUES ($1, $2, $3) RETURNING *',
    [userId, routineId || null, notes || null]
  );
  return result.rows[0];
};

export const completeSession = async (sessionId: string) => {
  const result = await pool.query(
    'UPDATE sessions SET ended_at = CURRENT_TIMESTAMP WHERE session_id = $1 RETURNING *',
    [sessionId]
  );
  return result.rows[0];
};