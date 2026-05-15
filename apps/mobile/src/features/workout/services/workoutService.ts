import { Q } from '@nozbe/watermelondb';

import { database } from '../../../database';
import type { WorkoutSessionVM } from '../types/workoutSession.types';

const now = () => Date.now();

function secondsSince(timestamp: number) {
  return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
}

async function getOrCreateExercise(data: {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  notes?: string;
}) {
  const exercises = database.collections.get('exercises');
  const existing = await exercises.query(Q.where('exercise_id', data.exerciseId)).fetch();
  if (existing[0]) return existing[0] as any;

  const timestamp = now();
  return exercises.create((record: any) => {
    record.exerciseId = data.exerciseId;
    record.name = data.name;
    record.muscleGroup = data.muscleGroup;
    record.equipment = data.equipment;
    record.notes = data.notes || '';
    record.createdAt = timestamp;
    record.updatedAt = timestamp;
  });
}

async function seedDemoWorkout() {
  const routines = database.collections.get('routines');
  const routineExercises = database.collections.get('routine_exercises');
  const sessions = database.collections.get('sessions');
  const workoutSets = database.collections.get('workout_sets');
  const timestamp = now();

  const bench = await getOrCreateExercise({
    exerciseId: 'demo-bench-press-barbell',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    equipment: 'Barbell',
  });

  const lateralRaise = await getOrCreateExercise({
    exerciseId: 'demo-lateral-raise-dumbbell',
    name: 'Lateral Raise',
    muscleGroup: 'Shoulders',
    equipment: 'Dumbbell',
  });

  const squat = await getOrCreateExercise({
    exerciseId: 'demo-squat-barbell',
    name: 'Squat',
    muscleGroup: 'Legs',
    equipment: 'Barbell',
  });

  const routine = await routines.create((record: any) => {
    record.name = 'Upper Body Day';
    record.notes = 'Demo routine for workout tracking';
    record.createdAt = timestamp;
    record.updatedAt = timestamp;
  }) as any;

  const routineExerciseInputs = [
    { exercise: bench, sortOrder: 1, sets: 2, reps: 8, weight: 65, rest: 180, note: 'Third notch on machine' },
    { exercise: lateralRaise, sortOrder: 2, sets: 1, reps: 12, weight: 10, rest: 90, note: '' },
    { exercise: squat, sortOrder: 3, sets: 4, reps: 10, weight: 70, rest: 180, note: '' },
  ];

  const routineExerciseRecords: any[] = [];
  for (const item of routineExerciseInputs) {
    const routineExercise = await routineExercises.create((record: any) => {
      record.routineId = routine.id;
      record.exerciseId = item.exercise.id;
      record.sortOrder = item.sortOrder;
      record.targetSets = item.sets;
      record.targetReps = item.reps;
      record.defaultWeightKg = item.weight;
      record.defaultRestSeconds = item.rest;
      record.note = item.note;
      record.createdAt = timestamp;
      record.updatedAt = timestamp;
    }) as any;
    routineExerciseRecords.push({ ...item, routineExercise });
  }

  const session = await sessions.create((record: any) => {
    record.routineId = routine.id;
    record.name = routine.name;
    record.startedAt = timestamp - 4541000;
    record.endedAt = 0;
    record.status = 'active';
    record.createdAt = timestamp;
    record.updatedAt = timestamp;
  }) as any;

  const setInputs = [
    { re: routineExerciseRecords[0], order: 1, type: 'normal', prevW: 65, prevR: 4, w: 65, r: 5, rpe: 7, rest: 180, done: true },
    { re: routineExerciseRecords[0], order: 2, type: 'failure', prevW: 65, prevR: 3, w: 70, r: 10, rpe: 8, rest: 180, done: false },
    { re: routineExerciseRecords[1], order: 1, type: 'normal', prevW: 0, prevR: 0, w: 0, r: 0, rpe: 0, rest: 90, done: false },
    { re: routineExerciseRecords[2], order: 1, type: 'warmup', prevW: 30, prevR: 5, w: 70, r: 10, rpe: 8, rest: 180, done: false },
    { re: routineExerciseRecords[2], order: 2, type: 'normal', prevW: 65, prevR: 4, w: 70, r: 10, rpe: 8, rest: 180, done: false },
    { re: routineExerciseRecords[2], order: 3, type: 'normal', prevW: 65, prevR: 3, w: 70, r: 10, rpe: 8, rest: 180, done: false },
    { re: routineExerciseRecords[2], order: 4, type: 'drop', prevW: 60, prevR: 2, w: 70, r: 10, rpe: 8, rest: 180, done: false },
  ];

  for (const input of setInputs) {
    await workoutSets.create((record: any) => {
      record.sessionId = session.id;
      record.exerciseId = input.re.exercise.id;
      record.routineExerciseId = input.re.routineExercise.id;
      record.setOrder = input.order;
      record.setType = input.type;
      record.previousWeightKg = input.prevW;
      record.previousReps = input.prevR;
      record.weightKg = input.w;
      record.reps = input.r;
      record.rpe = input.rpe;
      record.restSeconds = input.rest;
      record.completed = input.done;
      record.createdAt = timestamp;
      record.updatedAt = timestamp;
    });
  }

  return session;
}

async function buildSessionViewModel(session: any): Promise<WorkoutSessionVM> {
  const routines = database.collections.get('routines');
  const routineExercises = database.collections.get('routine_exercises');
  const exercises = database.collections.get('exercises');
  const workoutSets = database.collections.get('workout_sets');

  const routine = await routines.find(session.routineId) as any;
  const routineExerciseRecords = await routineExercises
    .query(Q.where('routine_id', routine.id), Q.sortBy('sort_order', Q.asc))
    .fetch();

  const exerciseCards = [];

  for (const routineExercise of routineExerciseRecords as any[]) {
    const exercise = await exercises.find(routineExercise.exerciseId) as any;
    const sets = await workoutSets
      .query(
        Q.where('session_id', session.id),
        Q.where('routine_exercise_id', routineExercise.id),
        Q.sortBy('set_order', Q.asc),
      )
      .fetch();

    exerciseCards.push({
      id: routineExercise.id,
      name: `${exercise.name}${exercise.equipment ? ` (${exercise.equipment})` : ''}`,
      equipment: exercise.equipment,
      note: routineExercise.note || '',
      sets: (sets as any[]).map(set => ({
        id: set.id,
        order: set.setOrder,
        type: set.setType,
        previousWeightKg: set.previousWeightKg,
        previousReps: set.previousReps,
        weightKg: set.weightKg,
        reps: set.reps,
        rpe: set.rpe,
        restSeconds: set.restSeconds,
        completed: set.completed,
      })),
    });
  }

  return {
    id: session.id,
    routineName: routine.name,
    startedAt: session.startedAt,
    elapsedSeconds: secondsSince(session.startedAt),
    exercises: exerciseCards,
  };
}

export async function getOrCreateActiveWorkoutSession(): Promise<WorkoutSessionVM> {
  const sessions = database.collections.get('sessions');
  let activeSessions = await sessions.query(Q.where('status', 'active')).fetch();

  if (!activeSessions[0]) {
    await database.write(async () => {
      await seedDemoWorkout();
    });
    activeSessions = await sessions.query(Q.where('status', 'active')).fetch();
  }

  return buildSessionViewModel(activeSessions[0] as any);
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
}

export function formatSetRest(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}
