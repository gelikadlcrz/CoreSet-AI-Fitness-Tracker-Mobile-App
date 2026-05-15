export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  rpe: number;
}

export interface Exercise {
  id: string;
  name: string;
  note?: string;
  sets: WorkoutSet[];
}