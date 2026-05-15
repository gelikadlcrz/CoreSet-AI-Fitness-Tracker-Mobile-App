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
  name: string;
  equipment?: string;
  note?: string;
  sets: WorkoutSetVM[];
};

export type WorkoutSessionVM = {
  id: string;
  routineName: string;
  startedAt: number;
  elapsedSeconds: number;
  exercises: WorkoutExerciseVM[];
};
