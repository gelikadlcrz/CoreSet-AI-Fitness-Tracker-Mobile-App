import { pool } from '../config/db';

export const getAllExercises = async () => {
  const result = await pool.query('SELECT * FROM exercises WHERE deleted_at IS NULL ORDER BY name ASC');
  return result.rows;
};

export const getExerciseById = async (exerciseId: string) => {
  const result = await pool.query('SELECT * FROM exercises WHERE exercise_id = $1 AND deleted_at IS NULL', [exerciseId]);
  return result.rows[0];
};

export const createExercise = async (name: string, primaryMuscle: string, equipmentType: string) => {
  const result = await pool.query(
    'INSERT INTO exercises (name, primary_muscle, equipment_type) VALUES ($1, $2, $3) RETURNING *',
    [name, primaryMuscle, equipmentType]
  );
  return result.rows[0];
};

export const updateExercise = async (exerciseId: string, name: string, primaryMuscle: string, equipmentType: string) => {
  const result = await pool.query(
    'UPDATE exercises SET name = $1, primary_muscle = $2, equipment_type = $3 WHERE exercise_id = $4 AND deleted_at IS NULL RETURNING *',
    [name, primaryMuscle, equipmentType, exerciseId]
  );
  return result.rows[0];
};

export const deleteExercise = async (exerciseId: string) => {
  // Soft delete! We just stamp the deleted_at column instead of deleting the row.
  const result = await pool.query(
    'UPDATE exercises SET deleted_at = CURRENT_TIMESTAMP WHERE exercise_id = $1 RETURNING exercise_id', 
    [exerciseId]
  );
  return result.rows[0];
};