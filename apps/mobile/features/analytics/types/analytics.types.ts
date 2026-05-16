export type AnalyticsDateRange = '7d' | '30d' | '90d' | 'all';

export type AnalyticsMetric = 'estimated1RM' | 'totalVolume' | 'vlwd' | 'tut';

export type VerificationStatus = 'ai_verified' | 'manual';

export type ExportFormat = 'csv' | 'pdf';

export interface AnalyticsPoint {
  id: string;
  date: string;
  estimated1RM: number;
  totalVolume: number;
  vlwd: number;
  tut: number;
  bodyWeightKg?: number;
  bodyFatPercent?: number;
}

export interface SetHistoryItem {
  id: string;
  setId: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  performedAt: string;
  weightKg: number;
  reps: number;
  rpe: number;
  verificationStatus: VerificationStatus;
  averageDisplacementM: number;
  averageRepDurationSec: number;
  estimated1RM: number;
  totalVolume: number;
  vlwd: number;
  tut: number;
}

export interface AnalyticsDataset {
  points: AnalyticsPoint[];
  recentSets: SetHistoryItem[];
}

export interface ExportAnalyticsOptions {
  range: AnalyticsDateRange;
  metric: AnalyticsMetric;
  format: ExportFormat;
  excludeManualSets: boolean;
}

export interface AnalyticsExportResult {
  fileName: string;
  format: ExportFormat;
  metric: AnalyticsMetric;
  includedSetCount: number;
  excludedManualSets: boolean;
}

export interface AnalyticsQueryParams {
  userId: string;
  range?: AnalyticsDateRange;
  exerciseId?: string | null;
  includeManual?: boolean;
}

/**
 * DB-shaped rows. These intentionally use snake_case to match common SQL/API payloads.
 * The UI should not consume these directly; convert them to AnalyticsDataset first.
 */
export interface ExerciseRow {
  exercise_id: string;
  name: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'other';
  is_ai_trackable: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSessionRow {
  session_id: string;
  user_id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  source: 'workout_session' | 'imported' | 'manual_log';
  created_at: string;
  updated_at: string;
}

export interface WorkoutSetRow {
  set_id: string;
  session_id: string;
  user_id: string;
  exercise_id: string;
  set_order: number;
  weight_kg: number;
  reps: number;
  rpe: number;
  performed_at: string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface PoseRepMetricRow {
  rep_metric_id: string;
  set_id: string;
  rep_index: number;
  displacement_m: number;
  duration_sec: number;
  eccentric_sec: number | null;
  concentric_sec: number | null;
  peak_angular_velocity_deg_s: number | null;
  created_at: string;
}

export interface BodyMetricRow {
  body_metric_id: string;
  user_id: string;
  measured_at: string;
  body_weight_kg: number;
  body_fat_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsDbRows {
  exercises: ExerciseRow[];
  workoutSessions: WorkoutSessionRow[];
  workoutSets: WorkoutSetRow[];
  poseRepMetrics: PoseRepMetricRow[];
  bodyMetrics: BodyMetricRow[];
}
