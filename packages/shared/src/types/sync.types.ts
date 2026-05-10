// Shared TypeScript types for the WatermelonDB sync protocol.
// Used by both the API (push/pull service) and the mobile sync client.

export interface SyncEntityChanges<T> {
  created: T[];
  updated: T[];
  deleted: string[]; // Array of IDs
}

// ── What the server returns on a pull ─────────────────────────
export interface PullResponse {
  changes: {
    exercises:          SyncEntityChanges<ExerciseSyncRecord>;
    routines:           SyncEntityChanges<RoutineSyncRecord>;
    routine_exercises:  SyncEntityChanges<RoutineExerciseSyncRecord>;
    sessions:           SyncEntityChanges<SessionSyncRecord>;
    sets:               SyncEntityChanges<SetSyncRecord>;
    reps:               SyncEntityChanges<RepSyncRecord>;
    body_metrics:       SyncEntityChanges<BodyMetricSyncRecord>;
  };
  timestamp: number; // JS milliseconds — stored as next lastPulledAt
}

// ── What the phone sends on a push ───────────────────────────
export interface PushPayload {
  changes: {
    exercises?:          SyncEntityChanges<ExercisePushRecord>;
    routines?:           SyncEntityChanges<RoutinePushRecord>;
    routine_exercises?:  SyncEntityChanges<RoutineExercisePushRecord>;
    sessions?:           SyncEntityChanges<SessionPushRecord>;
    sets?:               SyncEntityChanges<SetPushRecord>;
    reps?:               SyncEntityChanges<RepPushRecord>;
    body_metrics?:       SyncEntityChanges<BodyMetricPushRecord>;
  };
  lastPulledAt: number;
}

// ── Per-entity record shapes ──────────────────────────────────
// "SyncRecord" = what the server sends down (full DB row shape)
// "PushRecord" = what the phone sends up (WatermelonDB local model shape)
// The id field maps to WatermelonDB's local record id.

export interface ExerciseSyncRecord {
  id: string;           // exercise_id
  name: string;
  primary_muscle: string;
  secondary_muscles?: unknown;
  equipment_type?: string;
  movement_pattern?: string;
  is_ai_tracked: boolean;
  ai_exercise_class?: string;
  is_bodyweight: boolean;
  is_custom: boolean;
  created_by_user?: string;
}

export interface ExercisePushRecord extends ExerciseSyncRecord {}

export interface RoutineSyncRecord {
  id: string;           // routine_id
  user_id: string;
  name: string;
  notes?: string;
  last_used_at?: string;
}

export interface RoutinePushRecord extends RoutineSyncRecord {}

export interface RoutineExerciseSyncRecord {
  id: string;           // routine_exercise_id
  routine_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets?: number;
  target_reps_min?: number;
  target_reps_max?: number;
  target_rpe?: number;
  rest_interval_s?: number;
  notes?: string;
}

export interface RoutineExercisePushRecord extends RoutineExerciseSyncRecord {}

export interface SessionSyncRecord {
  id: string;           // session_id
  user_id: string;
  routine_id?: string;
  started_at: string;
  ended_at?: string;
  total_reps?: number;
  total_vl_with_displacement?: number;
  total_vl_traditional?: number;
  total_duration_s?: number;
  notes?: string;
}

export interface SessionPushRecord extends SessionSyncRecord {}

export interface SetSyncRecord {
  id: string;           // set_id
  session_id: string;
  exercise_id: string;
  set_number: number;
  is_warmup: boolean;
  log_mode: 'ai' | 'manual';
  load_kg?: number;
  rep_count?: number;
  rpe?: number;
  vl_with_displacement?: number;
  vl_traditional?: number;
  total_displacement_m?: number;
  avg_rep_duration_s?: number;
  model_confidence_avg?: number;
  estimated_1rm?: number;
  started_at?: string;
  ended_at?: string;
  notes?: string;
}

export interface SetPushRecord extends SetSyncRecord {}

export interface RepSyncRecord {
  id: string;           // rep_id
  set_id: string;
  rep_number: number;
  total_duration_s?: number;
  eccentric_duration_s?: number;
  concentric_duration_s?: number;
  displacement_m?: number;
  peak_angular_velocity?: number;
  model_confidence?: number;
  flagged: boolean;
}

export interface RepPushRecord extends RepSyncRecord {}

export interface BodyMetricSyncRecord {
  id: string;           // metric_id
  user_id: string;
  logged_date: string;
  bodyweight_kg?: number;
  body_fat_pct?: number;
  notes?: string;
}

export interface BodyMetricPushRecord extends BodyMetricSyncRecord {}