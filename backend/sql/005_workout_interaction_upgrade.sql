-- apps/api/sql/005_workout_interaction_upgrade.sql
-- Run this against Aiven PostgreSQL before adding cloud sync for the interactive workout UI.
-- This keeps the cloud schema aligned with the WatermelonDB routine/session/set flow.

-- Local app focus metric selected from the analytics button.
ALTER TABLE routine_exercises
  ADD COLUMN IF NOT EXISTS focus_metric VARCHAR(40) DEFAULT 'previous';

-- The active workout UI tracks whether a set is normal, warm-up, failure, or drop.
ALTER TABLE sets
  ADD COLUMN IF NOT EXISTS routine_exercise_id UUID REFERENCES routine_exercises(routine_exercise_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS set_type VARCHAR(20) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS previous_weight_kg DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS previous_reps INTEGER,
  ADD COLUMN IF NOT EXISTS rest_seconds INTEGER DEFAULT 90;

-- Keep distance units aligned with the mobile settings UI.
-- Height/body distance uses meters or inches, not km/mi.
ALTER TABLE users
  ALTER COLUMN distance_unit SET DEFAULT 'm';

UPDATE users
SET distance_unit = CASE
  WHEN distance_unit IN ('km', 'meters') THEN 'm'
  WHEN distance_unit IN ('mi', 'inches') THEN 'in'
  ELSE distance_unit
END
WHERE distance_unit IN ('km', 'mi', 'meters', 'inches');

-- Exercise-level AI flags already exist in the initial schema, but these updates
-- make the four current AI-trained exercise classes explicit for existing rows.
UPDATE exercises
SET is_ai_tracked = TRUE,
    ai_exercise_class = COALESCE(NULLIF(ai_exercise_class, ''), LOWER(REPLACE(name, ' ', '_')))
WHERE LOWER(name) IN ('push up', 'push-up', 'squat', 'pull up', 'pull-up', 'bench press');

CREATE INDEX IF NOT EXISTS idx_sets_routine_exercise ON sets(routine_exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_completed ON sets(completed);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_focus_metric ON routine_exercises(focus_metric);
