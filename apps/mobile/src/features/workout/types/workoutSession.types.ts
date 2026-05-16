export type FocusMetric =
  | 'previous'
  | 'total_volume'
  | 'volume_increase'
  | 'total_reps'
  | 'weight_per_rep'
  | 'reps_per_set';

export type WorkoutSetVM = {
  id: string;
  order: number;
  type: string;
  previousWeightKg?: number;
  previousReps?: number;
  weightKg?: number;
  reps?: number;
  rpe?: number;
  restSeconds: number;
  completed: boolean;
};

export type WorkoutExerciseVM = {
  id: string;
  exerciseId: string;
  routineExerciseId: string;
  name: string;
  baseName?: string;
  equipment?: string;
  note?: string;
  focusMetric: FocusMetric;
  isAiTracked: boolean;
  isBodyweight: boolean;
  sets: WorkoutSetVM[];
};

export type WorkoutSessionVM = {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: number;
  elapsedSeconds: number;
  exercises: WorkoutExerciseVM[];
};

export type ExerciseHistorySummary = {
  totalSets: number;
  totalReps: number;
  bestWeightKg: number;
  totalVolumeKg: number;
};

export type ExercisePickerItem = {
  id: string;
  name: string;
  equipment?: string;
  primaryMuscle?: string;
  muscleGroup?: string;
  secondaryMuscles?: string[];
  equipmentType?: string;
  movementPattern?: string;
  notes?: string;
  isAiTracked?: boolean;
  isBodyweight?: boolean;
  isCustom?: boolean;
  thumbnailUrl?: string;
  demoVideoUrl?: string;
  aiExerciseClass?: string;
  history?: ExerciseHistorySummary;
};
