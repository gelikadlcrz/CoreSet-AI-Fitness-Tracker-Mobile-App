import { pool } from '../config/db';

export const logRep = async (
  setId: string, repNumber: number, eccentricS: number, 
  concentricS: number, displacementM: number, velocity: number, confidence: number
) => {
  const result = await pool.query(
    `INSERT INTO reps 
     (set_id, rep_number, eccentric_duration_s, concentric_duration_s, displacement_m, peak_angular_velocity, model_confidence) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [setId, repNumber, eccentricS, concentricS, displacementM, velocity, confidence]
  );
  return result.rows[0];
};