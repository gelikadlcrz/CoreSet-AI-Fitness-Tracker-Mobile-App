import { pool } from '../config/db';

export const createUser = async (authId: string, email: string, passwordHash: string, displayName: string) => {
  const result = await pool.query(
    'INSERT INTO users (auth_id, email, password_hash, display_name) VALUES ($1, $2, $3, $4) RETURNING user_id, email, display_name, created_at',
    [authId, email, passwordHash, displayName]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email]
  );
  return result.rows[0];
};

export const findUserById = async (userId: string) => {
  const result = await pool.query(
    'SELECT user_id, email, display_name, created_at, bodyweight_kg, preferred_units FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [userId]
  );
  return result.rows[0];
};

export const updateUser = async (userId: string, email: string, displayName: string) => {
  const result = await pool.query(
    'UPDATE users SET email = $1, display_name = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 AND deleted_at IS NULL RETURNING user_id, email, display_name',
    [email, displayName, userId]
  );
  return result.rows[0];
};