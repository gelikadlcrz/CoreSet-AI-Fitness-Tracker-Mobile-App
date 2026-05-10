-- apps/api/sql/003_sync_fixes.sql
-- Run this against your Aiven PostgreSQL database.
-- It fixes all 5 sync-related bugs found in the schema.

-- ─────────────────────────────────────────────────────────────
-- FIX 1: Add missing updated_at to exercises
-- sync.service.ts filters on updated_at but the column doesn't
-- exist, so every pull query crashes at runtime.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Back-fill existing rows so the column is never NULL
UPDATE exercises
  SET created_at = NOW(), updated_at = NOW()
  WHERE created_at IS NULL;


-- ─────────────────────────────────────────────────────────────
-- FIX 2: Add missing updated_at / created_at to every table
-- that participates in sync but is also missing the columns.
-- sessions, sets, reps, body_metrics, routine_exercises
-- all need updated_at so the pull query pattern works for them.
-- ─────────────────────────────────────────────────────────────

-- sessions already has no updated_at
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE sessions SET updated_at = started_at WHERE updated_at IS NULL;

-- sets has no created_at / updated_at
ALTER TABLE sets
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE sets SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL;

-- reps has no updated_at (uses `timestamp` as created_at)
ALTER TABLE reps
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE reps SET updated_at = timestamp WHERE updated_at IS NULL;

-- body_metrics has no updated_at
ALTER TABLE body_metrics
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE body_metrics SET updated_at = logged_date WHERE updated_at IS NULL;

-- routine_exercises has no created_at / updated_at
ALTER TABLE routine_exercises
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE routine_exercises SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL;


-- ─────────────────────────────────────────────────────────────
-- FIX 3: Auto-update trigger function
-- Without this, updated_at never changes when a row is edited,
-- so the phone will never receive updates during a pull.
-- One shared function, applied to every synced table.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table that sync reads from
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'exercises', 'routines', 'routine_exercises',
    'sessions', 'sets', 'reps', 'body_metrics', 'users'
  ] LOOP
    -- Drop first so re-running this migration is safe
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl
    );
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────
-- FIX 4: Indexes on updated_at for every synced table
-- The pull query does: WHERE updated_at > $lastPulledAt
-- Without an index this becomes a full table scan per sync.
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exercises_updated_at       ON exercises(updated_at);
CREATE INDEX IF NOT EXISTS idx_routines_updated_at        ON routines(updated_at);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_updated  ON routine_exercises(updated_at);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at        ON sessions(updated_at);
CREATE INDEX IF NOT EXISTS idx_sets_updated_at            ON sets(updated_at);
CREATE INDEX IF NOT EXISTS idx_reps_updated_at            ON reps(updated_at);
CREATE INDEX IF NOT EXISTS idx_body_metrics_updated_at    ON body_metrics(updated_at);