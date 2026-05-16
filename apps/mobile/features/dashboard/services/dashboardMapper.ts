import type {
  DashboardActivityVM,
  DashboardDbSnapshot,
  DashboardHomeVM,
  DashboardRoutineCardVM,
  DashboardUserRow,
  DashboardWorkoutSessionRow,
  DashboardWorkoutSetRow,
} from '../types/dashboard.types';

function getGreetingPrefix(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDateLabel(value?: string | null): string {
  if (!value) return 'Not used yet';

  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTimeLabel(value: string): string {
  const date = new Date(value);
  const datePart = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${datePart} • ${timePart}`;
}

function formatDuration(startedAt: string, endedAt?: string | null): string {
  if (!endedAt) return 'Active';

  const diffMs = Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime());
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  return `${hours} hr ${String(minutes).padStart(2, '0')}m`;
}

function formatVolume(totalVolume: number): string {
  return `${Math.round(totalVolume).toLocaleString()} kg`;
}

function sumSessionVolume(sessionId: string, sets: DashboardWorkoutSetRow[]): number {
  return sets
    .filter(set => set.session_id === sessionId)
    .reduce((total, set) => total + set.weight_kg * set.reps, 0);
}

function getLastSessionForRoutine(
  routineId: string,
  sessions: DashboardWorkoutSessionRow[],
): DashboardWorkoutSessionRow | undefined {
  return sessions
    .filter(session => session.routine_id === routineId && session.status === 'completed')
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
}

function mapRoutineCards(db: DashboardDbSnapshot, userId: string): DashboardRoutineCardVM[] {
  const userRoutines = db.routines.filter(routine => routine.user_id === userId);

  return userRoutines.map(routine => {
    const muscles = db.routine_muscle_groups
      .filter(row => row.routine_id === routine.id)
      .map(row => row.muscle_group);
    const lastSession = getLastSessionForRoutine(routine.id, db.workout_sessions);

    return {
      id: routine.id,
      name: routine.name,
      musclesLabel: muscles.length > 0 ? muscles.join(' • ') : 'Custom routine',
      lastUsedLabel: formatDateLabel(lastSession?.started_at ?? routine.updated_at),
    };
  });
}

function mapRecentActivities(db: DashboardDbSnapshot, userId: string): DashboardActivityVM[] {
  return db.workout_sessions
    .filter(session => session.user_id === userId && session.status === 'completed')
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 5)
    .map(session => ({
      id: session.id,
      title: session.title,
      dateLabel: formatDateTimeLabel(session.started_at),
      totalVolumeLabel: formatVolume(sumSessionVolume(session.id, db.workout_sets)),
      durationLabel: formatDuration(session.started_at, session.ended_at),
    }));
}

function getFallbackUser(userId: string): DashboardUserRow {
  return {
    id: userId,
    first_name: 'Athlete',
    last_name: null,
    email: null,
    avatar_url: null,
  };
}

export function mapDashboardHome(db: DashboardDbSnapshot, userId: string): DashboardHomeVM {
  const user = db.users.find(row => row.id === userId) ?? getFallbackUser(userId);
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');

  return {
    user: {
      id: user.id,
      firstName: user.first_name,
      fullName,
    },
    greeting: `${getGreetingPrefix()}, ${user.first_name}!`,
    subtitle: 'Ready to crush your goals today?',
    routines: mapRoutineCards(db, user.id),
    recentActivities: mapRecentActivities(db, user.id),
  };
}
