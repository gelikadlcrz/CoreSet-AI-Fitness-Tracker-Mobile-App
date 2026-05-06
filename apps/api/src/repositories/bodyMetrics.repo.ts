import { pool } from '../config/db';

export const logMetric = async (userId: string, weightKg?: number, fatPct?: number, notes?: string) => {
  const result = await pool.query(
    `INSERT INTO body_metrics (user_id, bodyweight_kg, body_fat_pct, notes) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, weightKg || null, fatPct || null, notes || null]
  );
  return result.rows[0];
};

export const getMetricsByUser = async (userId: string) => {
  const result = await pool.query(
    'SELECT * FROM body_metrics WHERE user_id = $1 AND deleted_at IS NULL ORDER BY logged_date DESC',
    [userId]
  );
  return result.rows;
};