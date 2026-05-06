import { pool } from '../config/db';

export const pullChanges = async (userId: string, lastPulledAt: number) => {
  // Convert JS timestamp (milliseconds) to PostgreSQL timestamp
  const lastPulledDate = new Date(lastPulledAt || 0).toISOString();

  // Example: Fetching exercises that changed since the last pull
  const exercisesResult = await pool.query(
    `SELECT * FROM exercises 
     WHERE (updated_at > $1 OR deleted_at > $1) 
     AND (created_by_user = $2 OR created_by_user IS NULL)`,
    [lastPulledDate, userId]
  );

  const exercises = exercisesResult.rows;

  // WatermelonDB expects data categorized into created, updated, and deleted
  const changes = {
    exercises: {
      created: exercises.filter(e => e.created_at > lastPulledDate && !e.deleted_at),
      updated: exercises.filter(e => e.created_at <= lastPulledDate && e.updated_at > lastPulledDate && !e.deleted_at),
      deleted: exercises.filter(e => e.deleted_at > lastPulledDate).map(e => e.exercise_id),
    },
    // You will eventually add routines, sessions, and sets here following the exact same pattern
  };

  // Return the changes and the new server time so the phone knows when it last synced
  return {
    changes,
    timestamp: Date.now(),
  };
};

export const pushChanges = async (userId: string, changes: any, lastPulledAt: number) => {
  // When the phone comes back online, it sends a massive object of everything the user did offline.
  // We wrap this in a SQL "Transaction" (BEGIN/COMMIT). If one insert fails, the whole thing rolls back so data doesn't corrupt.
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Example: Processing offline exercise creations
    if (changes.exercises && changes.exercises.created.length > 0) {
      for (const exercise of changes.exercises.created) {
        await client.query(
          `INSERT INTO exercises (exercise_id, name, primary_muscle, created_by_user) 
           VALUES ($1, $2, $3, $4)`,
          [exercise.id, exercise.name, exercise.primary_muscle, userId]
        );
      }
    }

    // You would add loops here for updated and deleted arrays as well

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};