import { pool } from '../config/db';
import { upsert, softDelete } from '../lib/pgHelpers';

// ─────────────────────────────────────────────────────────────
// PULL  –  server → phone
// Returns every row that changed since lastPulledAt.
// WatermelonDB calls GET /api/sync?lastPulledAt=<ms timestamp>
// ─────────────────────────────────────────────────────────────
export const pullChanges = async (userId: string, lastPulledAt: number) => {
  // Convert JS milliseconds to an ISO string Postgres can compare
  const since = new Date(lastPulledAt || 0).toISOString();

  // ── Exercises ──────────────────────────────────────────────
  // Global exercises (created_by_user IS NULL) + user's custom ones
  const { rows: exercises } = await pool.query<ExerciseRow>(
    `SELECT * FROM exercises
      WHERE (updated_at > $1 OR deleted_at > $1)
        AND (created_by_user = $2 OR created_by_user IS NULL)`,
    [since, userId],
  );

  // ── Routines ───────────────────────────────────────────────
  const { rows: routines } = await pool.query<RoutineRow>(
    `SELECT * FROM routines
      WHERE (updated_at > $1 OR deleted_at > $1)
        AND user_id = $2`,
    [since, userId],
  );

  // ── Routine exercises ──────────────────────────────────────
  const { rows: routineExercises } = await pool.query<RoutineExerciseRow>(
    `SELECT re.* FROM routine_exercises re
      JOIN routines r ON r.routine_id = re.routine_id
      WHERE (re.updated_at > $1 OR re.deleted_at > $1)
        AND r.user_id = $2`,
    [since, userId],
  );

  // ── Sessions ───────────────────────────────────────────────
  const { rows: sessions } = await pool.query<SessionRow>(
    `SELECT * FROM sessions
      WHERE (updated_at > $1 OR deleted_at > $1)
        AND user_id = $2`,
    [since, userId],
  );

  // ── Sets ───────────────────────────────────────────────────
  const { rows: sets } = await pool.query<SetRow>(
    `SELECT s.* FROM sets s
      JOIN sessions sess ON sess.session_id = s.session_id
      WHERE (s.updated_at > $1 OR s.deleted_at > $1)
        AND sess.user_id = $2`,
    [since, userId],
  );

  // ── Reps ───────────────────────────────────────────────────
  const { rows: reps } = await pool.query<RepRow>(
    `SELECT r.* FROM reps r
      JOIN sets s    ON s.set_id = r.set_id
      JOIN sessions sess ON sess.session_id = s.session_id
      WHERE (r.updated_at > $1 OR r.deleted_at > $1)
        AND sess.user_id = $2`,
    [since, userId],
  );

  // ── Body metrics ───────────────────────────────────────────
  const { rows: bodyMetrics } = await pool.query<BodyMetricRow>(
    `SELECT * FROM body_metrics
      WHERE (updated_at > $1 OR deleted_at > $1)
        AND user_id = $2`,
    [since, userId],
  );

  // ── Shape each collection into WatermelonDB's expected format ──
  // { created: [], updated: [], deleted: [] }
  const changes = {
    exercises:        splitChanges(exercises,       'exercise_id',        since),
    routines:         splitChanges(routines,         'routine_id',         since),
    routine_exercises:splitChanges(routineExercises, 'routine_exercise_id',since),
    sessions:         splitChanges(sessions,         'session_id',         since),
    sets:             splitChanges(sets,             'set_id',             since),
    reps:             splitChanges(reps,             'rep_id',             since),
    body_metrics:     splitChanges(bodyMetrics,      'metric_id',          since),
  };

  return {
    changes,
    timestamp: Date.now(), // Phone stores this as the next lastPulledAt
  };
};

// ─────────────────────────────────────────────────────────────
// PUSH  –  phone → server
// Phone sends everything it did offline since lastPulledAt.
// Wrapped in one transaction: if anything fails, nothing commits.
// WatermelonDB calls POST /api/sync with body { changes, lastPulledAt }
// ─────────────────────────────────────────────────────────────
export const pushChanges = async (
  userId: string,
  changes: SyncPushPayload,
  _lastPulledAt: number,
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Exercises ────────────────────────────────────────────
    for (const e of changes.exercises?.created ?? []) {
      await upsert(client, 'exercises', 'exercise_id', {
        exercise_id:      e.id,
        name:             e.name,
        primary_muscle:   e.primary_muscle,
        secondary_muscles:e.secondary_muscles ?? null,
        equipment_type:   e.equipment_type   ?? null,
        movement_pattern: e.movement_pattern  ?? null,
        is_custom:        true,
        created_by_user:  userId,
      });
    }
    for (const e of changes.exercises?.updated ?? []) {
      await upsert(client, 'exercises', 'exercise_id', {
        exercise_id:      e.id,
        name:             e.name,
        primary_muscle:   e.primary_muscle,
        secondary_muscles:e.secondary_muscles ?? null,
        equipment_type:   e.equipment_type   ?? null,
        movement_pattern: e.movement_pattern  ?? null,
        created_by_user:  userId,
      });
    }
    for (const id of changes.exercises?.deleted ?? []) {
      await softDelete(client, 'exercises', 'exercise_id', id);
    }

    // ── Routines ─────────────────────────────────────────────
    for (const r of changes.routines?.created ?? []) {
      await upsert(client, 'routines', 'routine_id', {
        routine_id: r.id,
        user_id:    userId,
        name:       r.name,
        notes:      r.notes ?? null,
      });
    }
    for (const r of changes.routines?.updated ?? []) {
      await upsert(client, 'routines', 'routine_id', {
        routine_id:   r.id,
        user_id:      userId,
        name:         r.name,
        notes:        r.notes     ?? null,
        last_used_at: r.last_used_at ?? null,
      });
    }
    for (const id of changes.routines?.deleted ?? []) {
      await softDelete(client, 'routines', 'routine_id', id);
    }

    // ── Routine exercises ─────────────────────────────────────
    for (const re of changes.routine_exercises?.created ?? []) {
      await upsert(client, 'routine_exercises', 'routine_exercise_id', {
        routine_exercise_id: re.id,
        routine_id:          re.routine_id,
        exercise_id:         re.exercise_id,
        sort_order:          re.sort_order,
        target_sets:         re.target_sets         ?? null,
        target_reps_min:     re.target_reps_min     ?? null,
        target_reps_max:     re.target_reps_max     ?? null,
        target_rpe:          re.target_rpe          ?? null,
        rest_interval_s:     re.rest_interval_s     ?? null,
        notes:               re.notes               ?? null,
      });
    }
    for (const re of changes.routine_exercises?.updated ?? []) {
      await upsert(client, 'routine_exercises', 'routine_exercise_id', {
        routine_exercise_id: re.id,
        routine_id:          re.routine_id,
        exercise_id:         re.exercise_id,
        sort_order:          re.sort_order,
        target_sets:         re.target_sets         ?? null,
        target_reps_min:     re.target_reps_min     ?? null,
        target_reps_max:     re.target_reps_max     ?? null,
        target_rpe:          re.target_rpe          ?? null,
        rest_interval_s:     re.rest_interval_s     ?? null,
        notes:               re.notes               ?? null,
      });
    }
    for (const id of changes.routine_exercises?.deleted ?? []) {
      await softDelete(client, 'routine_exercises', 'routine_exercise_id', id);
    }

    // ── Sessions ──────────────────────────────────────────────
    for (const s of changes.sessions?.created ?? []) {
      await upsert(client, 'sessions', 'session_id', {
        session_id:  s.id,
        user_id:     userId,
        routine_id:  s.routine_id ?? null,
        started_at:  s.started_at,
        ended_at:    s.ended_at   ?? null,
        notes:       s.notes      ?? null,
      });
    }
    for (const s of changes.sessions?.updated ?? []) {
      await upsert(client, 'sessions', 'session_id', {
        session_id:                  s.id,
        user_id:                     userId,
        routine_id:                  s.routine_id                  ?? null,
        started_at:                  s.started_at,
        ended_at:                    s.ended_at                    ?? null,
        total_reps:                  s.total_reps                  ?? null,
        total_vl_with_displacement:  s.total_vl_with_displacement  ?? null,
        total_vl_traditional:        s.total_vl_traditional        ?? null,
        total_duration_s:            s.total_duration_s            ?? null,
        notes:                       s.notes                       ?? null,
      });
    }
    for (const id of changes.sessions?.deleted ?? []) {
      await softDelete(client, 'sessions', 'session_id', id);
    }

    // ── Sets ──────────────────────────────────────────────────
    for (const set of changes.sets?.created ?? []) {
      await upsert(client, 'sets', 'set_id', {
        set_id:       set.id,
        session_id:   set.session_id,
        exercise_id:  set.exercise_id,
        set_number:   set.set_number,
        is_warmup:    set.is_warmup    ?? false,
        log_mode:     set.log_mode,
        load_kg:      set.load_kg      ?? null,
        rep_count:    set.rep_count    ?? null,
        rpe:          set.rpe          ?? null,
        started_at:   set.started_at   ?? null,
        ended_at:     set.ended_at     ?? null,
        notes:        set.notes        ?? null,
        // AI fields
        vl_with_displacement:  set.vl_with_displacement  ?? null,
        vl_traditional:        set.vl_traditional        ?? null,
        total_displacement_m:  set.total_displacement_m  ?? null,
        avg_rep_duration_s:    set.avg_rep_duration_s    ?? null,
        model_confidence_avg:  set.model_confidence_avg  ?? null,
        estimated_1rm:         set.estimated_1rm         ?? null,
      });
    }
    for (const set of changes.sets?.updated ?? []) {
      await upsert(client, 'sets', 'set_id', {
        set_id:       set.id,
        session_id:   set.session_id,
        exercise_id:  set.exercise_id,
        set_number:   set.set_number,
        is_warmup:    set.is_warmup    ?? false,
        log_mode:     set.log_mode,
        load_kg:      set.load_kg      ?? null,
        rep_count:    set.rep_count    ?? null,
        rpe:          set.rpe          ?? null,
        started_at:   set.started_at   ?? null,
        ended_at:     set.ended_at     ?? null,
        notes:        set.notes        ?? null,
        vl_with_displacement:  set.vl_with_displacement  ?? null,
        vl_traditional:        set.vl_traditional        ?? null,
        total_displacement_m:  set.total_displacement_m  ?? null,
        avg_rep_duration_s:    set.avg_rep_duration_s    ?? null,
        model_confidence_avg:  set.model_confidence_avg  ?? null,
        estimated_1rm:         set.estimated_1rm         ?? null,
      });
    }
    for (const id of changes.sets?.deleted ?? []) {
      await softDelete(client, 'sets', 'set_id', id);
    }

    // ── Reps ──────────────────────────────────────────────────
    // Reps are insert-only from the phone (AI data, never edited).
    // We still handle deleted[] in case the user deletes a flagged rep.
    for (const rep of changes.reps?.created ?? []) {
      await upsert(client, 'reps', 'rep_id', {
        rep_id:               rep.id,
        set_id:               rep.set_id,
        rep_number:           rep.rep_number,
        total_duration_s:     rep.total_duration_s     ?? null,
        eccentric_duration_s: rep.eccentric_duration_s ?? null,
        concentric_duration_s:rep.concentric_duration_s?? null,
        displacement_m:       rep.displacement_m       ?? null,
        peak_angular_velocity:rep.peak_angular_velocity?? null,
        model_confidence:     rep.model_confidence     ?? null,
        flagged:              rep.flagged              ?? false,
      });
    }
    for (const id of changes.reps?.deleted ?? []) {
      await softDelete(client, 'reps', 'rep_id', id);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Splits a flat array of DB rows into the three buckets
 * WatermelonDB expects: created, updated, deleted.
 *
 * A row is "created"  if created_at > since and it is not soft-deleted.
 * A row is "updated"  if created_at <= since, updated_at > since, and not deleted.
 * A row is "deleted"  if deleted_at > since (regardless of created_at).
 *
 * Deleted entries are returned as plain ID strings, not full objects.
 */
function splitChanges<T extends Record<string, unknown>>(
  rows: T[],
  idColumn: string,
  since: string,
): { created: T[]; updated: T[]; deleted: string[] } {
  const sinceMs = new Date(since).getTime();

  return {
    created: rows.filter(
      r => !r.deleted_at && new Date(r.created_at as string).getTime() > sinceMs,
    ),
    updated: rows.filter(
      r =>
        !r.deleted_at &&
        new Date(r.created_at as string).getTime() <= sinceMs &&
        new Date(r.updated_at as string).getTime() > sinceMs,
    ),
    deleted: rows
      .filter(r => r.deleted_at && new Date(r.deleted_at as string).getTime() > sinceMs)
      .map(r => r[idColumn] as string),
  };
}

// ─────────────────────────────────────────────────────────────
// Types  (move these to packages/shared/src/types/sync.types.ts
//         once that package is filled in)
// ─────────────────────────────────────────────────────────────

interface ExerciseRow       { exercise_id: string; created_at: string; updated_at: string; deleted_at?: string; [k: string]: unknown }
interface RoutineRow        { routine_id: string; created_at: string; updated_at: string; deleted_at?: string; [k: string]: unknown }
interface RoutineExerciseRow{ routine_exercise_id: string; created_at: string; updated_at: string; deleted_at?: string; [k: string]: unknown }
interface SessionRow        { session_id: string; started_at: string; updated_at: string; deleted_at?: string; created_at: string; [k: string]: unknown }
interface SetRow            { set_id: string; created_at: string; updated_at: string; deleted_at?: string; [k: string]: unknown }
interface RepRow            { rep_id: string; timestamp: string; updated_at: string; deleted_at?: string; created_at: string; [k: string]: unknown }
interface BodyMetricRow     { metric_id: string; logged_date: string; updated_at: string; deleted_at?: string; created_at: string; [k: string]: unknown }

interface SyncEntityChanges<T> {
  created?: T[];
  updated?: T[];
  deleted?: string[];
}

interface SyncPushPayload {
  exercises?:         SyncEntityChanges<Record<string, unknown>>;
  routines?:          SyncEntityChanges<Record<string, unknown>>;
  routine_exercises?: SyncEntityChanges<Record<string, unknown>>;
  sessions?:          SyncEntityChanges<Record<string, unknown>>;
  sets?:              SyncEntityChanges<Record<string, unknown>>;
  reps?:              SyncEntityChanges<Record<string, unknown>>;
  body_metrics?:      SyncEntityChanges<Record<string, unknown>>;
}