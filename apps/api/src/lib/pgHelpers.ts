// Reusable query helpers shared across all sync push handlers.
// Every function accepts a PoolClient so it can participate in
// the caller's BEGIN/COMMIT transaction.

import { PoolClient } from 'pg';

/**
 * Generic upsert for any table.
 *
 * On conflict with the primary key it updates every column that
 * was provided — skipping the id column itself.
 *
 * Usage:
 *   await upsert(client, 'exercises', 'exercise_id', {
 *     exercise_id: row.id,
 *     name: row.name,
 *     primary_muscle: row.primary_muscle,
 *     created_by_user: userId,
 *   });
 */
export const upsert = async (
  client: PoolClient,
  table: string,
  idColumn: string,
  data: Record<string, unknown>,
): Promise<void> => {
  const columns = Object.keys(data);
  const values  = Object.values(data);

  // $1, $2, $3 …
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  // For every column that is NOT the primary key:
  //   name = EXCLUDED.name
  const updates = columns
    .filter(col => col !== idColumn)
    .map(col => `"${col}" = EXCLUDED."${col}"`)
    .join(', ');

  const sql = `
    INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')})
    VALUES (${placeholders})
    ON CONFLICT ("${idColumn}") DO UPDATE
      SET ${updates}, updated_at = NOW()
  `;

  await client.query(sql, values);
};

/**
 * Soft-delete a row by stamping deleted_at.
 *
 * WatermelonDB sends deleted[] arrays as plain string IDs.
 * This stamps each one rather than hard-deleting so foreign keys
 * and audit history stay intact.
 *
 * Usage:
 *   await softDelete(client, 'exercises', 'exercise_id', id);
 */
export const softDelete = async (
  client: PoolClient,
  table: string,
  idColumn: string,
  id: string,
): Promise<void> => {
  await client.query(
    `UPDATE "${table}"
        SET deleted_at = NOW(), updated_at = NOW()
      WHERE "${idColumn}" = $1
        AND deleted_at IS NULL`,
    [id],
  );
};