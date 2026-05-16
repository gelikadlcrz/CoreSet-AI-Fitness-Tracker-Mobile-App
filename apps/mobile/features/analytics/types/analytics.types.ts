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
