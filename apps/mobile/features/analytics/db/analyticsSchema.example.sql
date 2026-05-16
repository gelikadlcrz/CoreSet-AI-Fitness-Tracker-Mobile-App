-- Example schema for the Progression & Analytics feature.
-- Adjust table names/types if your backend already has users, workouts, or exercise tables.

CREATE TABLE exercises (
  exercise_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL,
  is_ai_trackable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE workout_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(120) NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NULL,
  source ENUM('workout_session', 'imported', 'manual_log') NOT NULL DEFAULT 'workout_session',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_workout_sessions_user_started (user_id, started_at)
);

CREATE TABLE workout_sets (
  set_id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  exercise_id VARCHAR(64) NOT NULL,
  set_order INT NOT NULL,
  weight_kg DECIMAL(6,2) NOT NULL,
  reps INT NOT NULL,
  rpe DECIMAL(3,1) NOT NULL,
  performed_at DATETIME NOT NULL,
  verification_status ENUM('ai_verified', 'manual') NOT NULL DEFAULT 'manual',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_workout_sets_user_performed (user_id, performed_at),
  INDEX idx_workout_sets_exercise_performed (exercise_id, performed_at),
  CONSTRAINT fk_workout_sets_session FOREIGN KEY (session_id) REFERENCES workout_sessions(session_id),
  CONSTRAINT fk_workout_sets_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
);

CREATE TABLE pose_rep_metrics (
  rep_metric_id VARCHAR(80) PRIMARY KEY,
  set_id VARCHAR(64) NOT NULL,
  rep_index INT NOT NULL,
  displacement_m DECIMAL(6,3) NOT NULL,
  duration_sec DECIMAL(6,3) NOT NULL,
  eccentric_sec DECIMAL(6,3) NULL,
  concentric_sec DECIMAL(6,3) NULL,
  peak_angular_velocity_deg_s DECIMAL(8,2) NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_pose_rep_metrics_set (set_id),
  CONSTRAINT fk_pose_rep_metrics_set FOREIGN KEY (set_id) REFERENCES workout_sets(set_id)
);

CREATE TABLE body_metrics (
  body_metric_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  measured_at DATETIME NOT NULL,
  body_weight_kg DECIMAL(5,2) NOT NULL,
  body_fat_percent DECIMAL(5,2) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_body_metrics_user_measured (user_id, measured_at)
);
