export type DashboardUserRow = {
  id: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

export type DashboardRoutineRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type DashboardRoutineMuscleRow = {
  id: string;
  routine_id: string;
  muscle_group: string;
};

export type DashboardWorkoutSessionRow = {
  id: string;
  user_id: string;
  routine_id?: string | null;
  title: string;
  started_at: string;
  ended_at?: string | null;
  status: 'active' | 'completed' | 'cancelled';
};

export type DashboardWorkoutSetRow = {
  id: string;
  session_id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  rpe?: number | null;
  source: 'ai_verified' | 'manual';
};

export type DashboardDbSnapshot = {
  users: DashboardUserRow[];
  routines: DashboardRoutineRow[];
  routine_muscle_groups: DashboardRoutineMuscleRow[];
  workout_sessions: DashboardWorkoutSessionRow[];
  workout_sets: DashboardWorkoutSetRow[];
};

export type DashboardRoutineCardVM = {
  id: string;
  name: string;
  musclesLabel: string;
  lastUsedLabel: string;
};

export type DashboardActivityVM = {
  id: string;
  title: string;
  dateLabel: string;
  totalVolumeLabel: string;
  durationLabel: string;
};

export type DashboardHomeVM = {
  user: {
    id: string;
    firstName: string;
    fullName: string;
  };
  greeting: string;
  subtitle: string;
  routines: DashboardRoutineCardVM[];
  recentActivities: DashboardActivityVM[];
};
