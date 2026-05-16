-- Example schema for the Dashboard feature.
-- Use this as a guide for MySQL/PostgreSQL table design.
-- The frontend mock data follows these row shapes so it can be replaced by API data later.

CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(80) NOT NULL UNIQUE,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  profile_photo_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE routines (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  icon_url TEXT NULL,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE routine_muscle_groups (
  id VARCHAR(64) PRIMARY KEY,
  routine_id VARCHAR(64) NOT NULL,
  muscle_group VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (routine_id) REFERENCES routines(id)
);

CREATE TABLE workout_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  routine_id VARCHAR(64) NULL,
  title VARCHAR(120) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NULL,
  status VARCHAR(32) NOT NULL,
  thumbnail_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (routine_id) REFERENCES routines(id)
);

CREATE TABLE workout_sets (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  exercise_id VARCHAR(64) NOT NULL,
  exercise_name VARCHAR(120) NOT NULL,
  set_number INT NOT NULL,
  load_kg DECIMAL(8, 2) NOT NULL DEFAULT 0,
  reps INT NOT NULL DEFAULT 0,
  rpe DECIMAL(3, 1) NULL,
  verification_source VARCHAR(20) NOT NULL DEFAULT 'manual',
  completed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id)
);

-- Suggested dashboard API response:
-- GET /dashboard/home?userId=demo_user_001
-- {
--   "user": {...},
--   "routines": [...],
--   "routineMuscleGroups": [...],
--   "workoutSessions": [...],
--   "workoutSets": [...]
-- }
