-- 006_exercise_metadata_and_sample_data.sql
-- Adds exercise preview metadata for the mobile Add Exercise preview flow.
-- Safe to rerun.

-- Make sure sync/display metadata columns exist.
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS default_notes TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS demo_video_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Fix distance unit safely.
-- The original enum allows 'meters' and 'inches', not 'm' and 'in'.
DO $$
DECLARE
  distance_type TEXT;
BEGIN
  SELECT udt_name
  INTO distance_type
  FROM information_schema.columns
  WHERE table_name = 'users'
    AND column_name = 'distance_unit';

  IF distance_type IS NULL THEN
    ALTER TABLE users
      ADD COLUMN distance_unit VARCHAR(10) DEFAULT 'meters';

    UPDATE users
    SET distance_unit = 'meters'
    WHERE distance_unit IS NULL;

  ELSIF distance_type = 'unit_preference' THEN
    ALTER TABLE users
      ALTER COLUMN distance_unit SET DEFAULT 'meters'::unit_preference;

    UPDATE users
    SET distance_unit = 'meters'::unit_preference
    WHERE distance_unit IS NULL;

  ELSE
    ALTER TABLE users
      ALTER COLUMN distance_unit SET DEFAULT 'meters';

    UPDATE users
    SET distance_unit = 'meters'
    WHERE distance_unit IS NULL
       OR distance_unit IN ('km', 'mi', 'm', 'meter', 'meters');
  END IF;
END $$;

-- AI-tracked exercises
UPDATE exercises
SET
  default_notes = 'Bodyweight horizontal pushing movement used for AI rep counting and upper-body endurance tracking.',
  description = 'The push-up trains the chest, triceps, and front delts using bodyweight resistance. It is AI-tracked in CoreSet for repetition counting and movement consistency.',
  thumbnail_url = 'https://placehold.co/512x512/111111/E9FF21.png?text=Push+Up',
  demo_video_url = COALESCE(demo_video_url, ''),
  updated_at = NOW()
WHERE LOWER(name) IN ('push up', 'push-up', 'pushup');

UPDATE exercises
SET
  default_notes = 'Bodyweight vertical pulling movement used for AI rep counting. Assisted versions may use negative load values.',
  description = 'The pull-up trains the lats, biceps, and upper back. Assisted pull-ups can be represented with negative load values, such as -20 kg assistance.',
  thumbnail_url = 'https://placehold.co/512x512/111111/E9FF21.png?text=Pull+Up',
  demo_video_url = COALESCE(demo_video_url, ''),
  updated_at = NOW()
WHERE LOWER(name) IN ('pull up', 'pull-up', 'pullup');

UPDATE exercises
SET
  default_notes = 'Squat-pattern movement used for AI rep counting and lower-body tracking.',
  description = 'The squat targets the quads, glutes, and hamstrings. CoreSet can track squat repetitions using the camera-based AI workflow.',
  thumbnail_url = 'https://placehold.co/512x512/111111/E9FF21.png?text=Squat',
  demo_video_url = COALESCE(demo_video_url, ''),
  updated_at = NOW()
WHERE LOWER(name) IN ('squat', 'bodyweight squat', 'barbell squat');

UPDATE exercises
SET
  default_notes = 'Horizontal barbell pressing movement used for AI rep counting and strength tracking.',
  description = 'The bench press trains the chest, triceps, and front delts. It supports weighted tracking, volume metrics, and AI-based repetition counting.',
  thumbnail_url = 'https://placehold.co/512x512/111111/E9FF21.png?text=Bench+Press',
  demo_video_url = COALESCE(demo_video_url, ''),
  updated_at = NOW()
WHERE LOWER(name) IN ('bench press', 'barbell bench press');

-- Common manual/demo exercises
UPDATE exercises
SET
  default_notes = 'Dumbbell isolation movement for shoulder training.',
  description = 'The lateral raise targets the side delts. It is manually logged and useful for accessory shoulder volume tracking.',
  thumbnail_url = 'https://placehold.co/512x512/111111/E9FF21.png?text=Lateral+Raise',
  updated_at = NOW()
WHERE LOWER(name) LIKE '%lateral raise%';

UPDATE exercises
SET
  default_notes = 'Core movement commonly logged by reps.',
  description = 'The 3/4 sit-up is a bodyweight core exercise used for abdominal endurance tracking.',
  thumbnail_url = 'https://placehold.co/512x512/111111/E9FF21.png?text=3%2F4+Sit-up',
  updated_at = NOW()
WHERE LOWER(name) LIKE '%3/4 sit%' OR LOWER(name) LIKE '%sit-up%' OR LOWER(name) LIKE '%sit up%';

UPDATE exercises
SET
  default_notes = 'Core side-bending movement.',
  description = 'The 45° side bend targets the obliques and can be logged as a manual bodyweight or weighted accessory movement.',
  thumbnail_url = 'https://placehold.co/512x512/111111/E9FF21.png?text=Side+Bend',
  updated_at = NOW()
WHERE LOWER(name) LIKE '%side bend%';

UPDATE exercises
SET
  default_notes = 'Bodyweight core conditioning movement.',
  description = 'The air bike is a bodyweight abdominal movement commonly used for core endurance and conditioning.',
  thumbnail_url = 'https://placehold.co/512x512/111111/E9FF21.png?text=Air+Bike',
  updated_at = NOW()
WHERE LOWER(name) LIKE '%air bike%';

-- Fallback metadata for any remaining exercises
UPDATE exercises
SET
  default_notes = COALESCE(default_notes, 'Manual exercise available for routine and workout logging.'),
  description = COALESCE(description, 'Exercise details can be expanded as more metadata becomes available from the CoreSet exercise library.'),
  thumbnail_url = COALESCE(thumbnail_url, 'https://placehold.co/512x512/111111/E9FF21.png?text=CoreSet'),
  updated_at = NOW()
WHERE deleted_at IS NULL;
