-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE unit_preference AS ENUM ('kg', 'lbs', 'meters', 'inches');
CREATE TYPE log_mode_enum AS ENUM ('ai', 'manual');
CREATE TYPE export_format_enum AS ENUM ('pdf', 'csv');

-- 2. USERS
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bodyweight_kg DECIMAL(5,2),
    preferred_units unit_preference DEFAULT 'kg',
    preferred_bar_kg DECIMAL(5,2) DEFAULT 20.0,
    default_rest_s INTEGER DEFAULT 90,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.80,
    theme VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 3. BODY METRICS
CREATE TABLE body_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    logged_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    bodyweight_kg DECIMAL(5,2),
    body_fat_pct DECIMAL(4,2),
    notes TEXT,
    deleted_at TIMESTAMPTZ
);

-- 4. EXERCISE LIBRARY
CREATE TABLE exercises (
    exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    primary_muscle VARCHAR(50) NOT NULL,
    secondary_muscles JSONB,
    equipment_type VARCHAR(50),
    movement_pattern VARCHAR(50),
    is_ai_tracked BOOLEAN DEFAULT FALSE,
    ai_exercise_class VARCHAR(50),
    is_bodyweight BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT FALSE,
    created_by_user UUID REFERENCES users(user_id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- 5. ROUTINES
CREATE TABLE routines (
    routine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE routine_exercises (
    routine_exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES routines(routine_id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    target_sets INTEGER,
    target_reps_min INTEGER,
    target_reps_max INTEGER,
    target_rpe DECIMAL(3,1),
    rest_interval_s INTEGER,
    notes TEXT,
    deleted_at TIMESTAMPTZ
);

-- 6. SESSIONS & SETS
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    routine_id UUID REFERENCES routines(routine_id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    total_reps INTEGER DEFAULT 0,
    total_vl_with_displacement DECIMAL(10,2),
    total_vl_traditional DECIMAL(10,2),
    total_duration_s INTEGER,
    notes TEXT,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE sets (
    set_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(exercise_id),
    set_number INTEGER NOT NULL,
    is_warmup BOOLEAN DEFAULT FALSE,
    log_mode log_mode_enum NOT NULL,
    load_kg DECIMAL(6,2),
    rep_count INTEGER,
    rpe DECIMAL(3,1) CHECK (rpe >= 0 AND rpe <= 10),
    vl_with_displacement DECIMAL(8,2),
    vl_traditional DECIMAL(8,2),
    total_displacement_m DECIMAL(6,2),
    avg_rep_duration_s DECIMAL(5,2),
    avg_tut_eccentric_s DECIMAL(5,2),
    avg_tut_concentric_s DECIMAL(5,2),
    model_confidence_avg DECIMAL(3,2),
    estimated_1rm DECIMAL(6,2),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    notes TEXT,
    deleted_at TIMESTAMPTZ
);

-- 7. REPS (AI micro-analytics)
CREATE TABLE reps (
    rep_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES sets(set_id) ON DELETE CASCADE,
    rep_number INTEGER NOT NULL,
    total_duration_s DECIMAL(5,2),
    eccentric_duration_s DECIMAL(5,2),
    concentric_duration_s DECIMAL(5,2),
    displacement_m DECIMAL(5,2),
    peak_angular_velocity DECIMAL(6,2),
    model_confidence DECIMAL(3,2) CHECK (model_confidence >= 0.0 AND model_confidence <= 1.0),
    flagged BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 8. EXPORT HISTORY
CREATE TABLE exports (
    export_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    export_format export_format_enum NOT NULL,
    date_range_start TIMESTAMPTZ NOT NULL,
    date_range_end TIMESTAMPTZ NOT NULL,
    include_manual BOOLEAN DEFAULT TRUE,
    include_rep_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_sets_session ON sets(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_reps_set ON reps(set_id);
CREATE INDEX IF NOT EXISTS idx_exercises_ai ON exercises(is_ai_tracked);
CREATE INDEX IF NOT EXISTS idx_exports_user ON exports(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user ON body_metrics(user_id, logged_date);