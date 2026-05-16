import { Q } from '@nozbe/watermelondb';

import { database } from '../../../database';
import type {
  ExercisePickerItem,
  FocusMetric,
  WorkoutSessionVM,
} from '../types/workoutSession.types';

const now = () => Date.now();

const AI_EXERCISE_NAMES = ['push up', 'push-up', 'squat', 'pull up', 'pull-up', 'bench press'];

function parseSecondaryMuscles(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item)).filter(Boolean);
      }
    } catch {
      return trimmed
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

async function buildExerciseHistory(exerciseId: string) {
  const sets = await database.collections
    .get('workout_sets')
    .query(Q.where('exercise_id', exerciseId), isLiveRecordQuery())
    .fetch();

  let totalReps = 0;
  let bestWeightKg = 0;
  let totalVolumeKg = 0;

  for (const set of sets as any[]) {
    const reps = Number(set.reps || 0);
    const weightKg = Number(set.weightKg || 0);

    totalReps += reps;
    bestWeightKg = Math.max(bestWeightKg, weightKg);
    totalVolumeKg += Math.max(0, weightKg) * reps;
  }

  return {
    totalSets: sets.length,
    totalReps,
    bestWeightKg,
    totalVolumeKg,
  };
}

function secondsSince(timestamp: number) {
  return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
}

function isLiveRecordQuery() {
  return Q.or(Q.where('deleted_at', Q.eq(null)), Q.where('deleted_at', 0));
}

function isAiTrackedByName(name: string) {
  const normalized = name.toLowerCase();
  return AI_EXERCISE_NAMES.some(keyword => normalized.includes(keyword));
}

async function getCurrentRemoteUserId() {
  const profiles = database.collections.get('user_profiles');
  const [profile] = await profiles.query().fetch();
  const remoteUserId = (profile as any)?.remoteUserId || (profile as any)?.userId || '';
  return remoteUserId || 'local-demo-user';
}

async function findExerciseByExternalId(exerciseId: string) {
  const exercises = database.collections.get('exercises');
  const [existing] = await exercises.query(Q.where('exercise_id', exerciseId)).fetch();
  return existing as any | undefined;
}

async function ensureDemoExercise(data: {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  primaryMuscle?: string;
  isAiTracked?: boolean;
  isBodyweight?: boolean;
}) {
  const existing = await findExerciseByExternalId(data.exerciseId);
  if (existing) return existing;

  const timestamp = now();
  return database.collections.get('exercises').create((record: any) => {
    record.exerciseId = data.exerciseId;
    record.name = data.name;
    record.muscleGroup = data.muscleGroup;
    record.equipment = data.equipment;
    record.notes = '';
    record.primaryMuscle = data.primaryMuscle || data.muscleGroup;
    record.secondaryMusclesJson = '[]';
    record.equipmentType = data.equipment;
    record.movementPattern = '';
    record.isAiTracked = !!data.isAiTracked || isAiTrackedByName(data.name);
    record.aiExerciseClass = record.isAiTracked ? data.name.toLowerCase().replace(/\s+/g, '_') : '';
    record.isBodyweight = !!data.isBodyweight || data.equipment === 'Bodyweight';
    record.isCustom = true;
    record.thumbnailUrl = '';
    record.demoVideoUrl = '';
    record.remoteCreatedByUser = '';
    record.deletedAt = 0;
    record.createdAt = timestamp;
    record.updatedAt = timestamp;
  }) as any;
}

async function seedDemoWorkout() {
  const timestamp = now();
  const remoteUserId = await getCurrentRemoteUserId();

  const routines = database.collections.get('routines');
  const routineExercises = database.collections.get('routine_exercises');
  const sessions = database.collections.get('sessions');
  const workoutSets = database.collections.get('workout_sets');

  const bench = await ensureDemoExercise({
    exerciseId: 'demo-bench-press-barbell',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    equipment: 'Barbell',
    primaryMuscle: 'Chest',
    isAiTracked: true,
  });

  const lateralRaise = await ensureDemoExercise({
    exerciseId: 'demo-lateral-raise-dumbbell',
    name: 'Lateral Raise',
    muscleGroup: 'Shoulders',
    equipment: 'Dumbbell',
    primaryMuscle: 'Shoulders',
  });

  const squat = await ensureDemoExercise({
    exerciseId: 'demo-squat-barbell',
    name: 'Squat',
    muscleGroup: 'Legs',
    equipment: 'Barbell',
    primaryMuscle: 'Quads',
    isAiTracked: true,
  });

  const routine = await routines.create((record: any) => {
    record.remoteRoutineId = '';
    record.remoteUserId = remoteUserId;
    record.name = 'Upper Body Day';
    record.notes = 'Local demo routine for workout tracking';
    record.lastUsedAt = timestamp;
    record.deletedAt = 0;
    record.createdAt = timestamp;
    record.updatedAt = timestamp;
  }) as any;

  const routineExerciseInputs = [
    { exercise: bench, sortOrder: 1, sets: 2, reps: 8, weight: 65, rest: 180, note: 'Third notch on machine', focus: 'previous' as FocusMetric },
    { exercise: lateralRaise, sortOrder: 2, sets: 1, reps: 12, weight: 10, rest: 90, note: '', focus: 'previous' as FocusMetric },
    { exercise: squat, sortOrder: 3, sets: 4, reps: 10, weight: 70, rest: 180, note: '', focus: 'previous' as FocusMetric },
  ];

  const routineExerciseRecords: any[] = [];

  for (const item of routineExerciseInputs) {
    const routineExercise = await routineExercises.create((record: any) => {
      record.remoteRoutineExerciseId = '';
      record.routineId = routine.id;
      record.exerciseId = item.exercise.id;
      record.sortOrder = item.sortOrder;
      record.targetSets = item.sets;
      record.targetReps = item.reps;
      record.targetRepsMin = Math.max(1, item.reps - 2);
      record.targetRepsMax = item.reps + 2;
      record.targetRpe = 8;
      record.defaultWeightKg = item.weight;
      record.defaultRestSeconds = item.rest;
      record.note = item.note;
      record.focusMetric = item.focus;
      record.deletedAt = 0;
      record.createdAt = timestamp;
      record.updatedAt = timestamp;
    }) as any;

    routineExerciseRecords.push({ ...item, routineExercise });
  }

  const session = await sessions.create((record: any) => {
    record.remoteSessionId = '';
    record.remoteUserId = remoteUserId;
    record.routineId = routine.id;
    record.name = routine.name;
    record.startedAt = timestamp - 4541000;
    record.endedAt = 0;
    record.status = 'active';
    record.totalReps = 0;
    record.totalDurationSeconds = 0;
    record.notes = '';
    record.deletedAt = 0;
    record.createdAt = timestamp;
    record.updatedAt = timestamp;
  }) as any;

  const setInputs = [
    { re: routineExerciseRecords[0], order: 1, type: 'normal', prevW: 65, prevR: 4, w: 65, r: 5, rpe: 7, rest: 180, done: false },
    { re: routineExerciseRecords[0], order: 2, type: 'failure', prevW: 65, prevR: 3, w: 70, r: 10, rpe: 8, rest: 180, done: true },
    { re: routineExerciseRecords[1], order: 1, type: 'normal', prevW: 0, prevR: 0, w: 0, r: 0, rpe: 0, rest: 90, done: false },
    { re: routineExerciseRecords[2], order: 1, type: 'warmup', prevW: 30, prevR: 5, w: 70, r: 10, rpe: 8, rest: 180, done: false },
    { re: routineExerciseRecords[2], order: 2, type: 'normal', prevW: 65, prevR: 4, w: 70, r: 10, rpe: 8, rest: 180, done: false },
    { re: routineExerciseRecords[2], order: 3, type: 'normal', prevW: 65, prevR: 3, w: 70, r: 10, rpe: 8, rest: 180, done: false },
    { re: routineExerciseRecords[2], order: 4, type: 'drop', prevW: 60, prevR: 2, w: 70, r: 10, rpe: 8, rest: 180, done: false },
  ];

  for (const input of setInputs) {
    await workoutSets.create((record: any) => {
      record.remoteSetId = '';
      record.sessionId = session.id;
      record.exerciseId = input.re.exercise.id;
      record.routineExerciseId = input.re.routineExercise.id;
      record.setOrder = input.order;
      record.setType = input.type;
      record.setNumber = input.order;
      record.isWarmup = input.type === 'warmup';
      record.logMode = 'manual';
      record.previousWeightKg = input.prevW;
      record.previousReps = input.prevR;
      record.weightKg = input.w;
      record.reps = input.r;
      record.rpe = input.rpe;
      record.restSeconds = input.rest;
      record.completed = input.done;
      record.modelConfidenceAvg = 0;
      record.totalDisplacementM = 0;
      record.notes = '';
      record.deletedAt = 0;
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
    .query(
      Q.where('routine_id', routine.id),
      isLiveRecordQuery(),
      Q.sortBy('sort_order', Q.asc),
    )
    .fetch();

  const exerciseCards = [];

  for (const routineExercise of routineExerciseRecords as any[]) {
    const exercise = await exercises.find(routineExercise.exerciseId) as any;
    const sets = await workoutSets
      .query(
        Q.where('session_id', session.id),
        Q.where('routine_exercise_id', routineExercise.id),
        isLiveRecordQuery(),
        Q.sortBy('set_order', Q.asc),
      )
      .fetch();

    const isBodyweight = !!exercise.isBodyweight;
    const isAiTracked = !!exercise.isAiTracked || isAiTrackedByName(exercise.name);

    exerciseCards.push({
      id: routineExercise.id,
      exerciseId: exercise.id,
      routineExerciseId: routineExercise.id,
      baseName: exercise.name,
      name: `${exercise.name}${exercise.equipment ? ` (${exercise.equipment})` : ''}`,
      equipment: exercise.equipment,
      note: routineExercise.note || '',
      focusMetric: routineExercise.focusMetric || 'previous',
      isAiTracked,
      isBodyweight,
      sets: (sets as any[]).map(set => ({
        id: set.id,
        order: set.setOrder,
        type: set.setType || (set.isWarmup ? 'warmup' : 'normal'),
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
    routineId: routine.id,
    routineName: routine.name,
    startedAt: session.startedAt,
    elapsedSeconds: secondsSince(session.startedAt),
    exercises: exerciseCards,
  };
}

export async function getOrCreateActiveWorkoutSession(): Promise<WorkoutSessionVM> {
  const sessions = database.collections.get('sessions');
  let activeSessions = await sessions
    .query(Q.where('status', 'active'), isLiveRecordQuery())
    .fetch();

  if (!activeSessions[0]) {
    await database.write(async () => {
      await seedDemoWorkout();
    });

    activeSessions = await sessions
      .query(Q.where('status', 'active'), isLiveRecordQuery())
      .fetch();
  }

  return buildSessionViewModel(activeSessions[0] as any);
}

export async function listAvailableExercises(): Promise<ExercisePickerItem[]> {
  const exercises = await database.collections
    .get('exercises')
    .query(isLiveRecordQuery(), Q.sortBy('name', Q.asc))
    .fetch();

  const items: ExercisePickerItem[] = [];

  for (const exercise of exercises as any[]) {
    items.push({
      id: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment || exercise.equipmentType || '',
      primaryMuscle: exercise.primaryMuscle || exercise.muscleGroup || '',
      muscleGroup: exercise.muscleGroup || exercise.primaryMuscle || '',
      secondaryMuscles: parseSecondaryMuscles(exercise.secondaryMusclesJson),
      equipmentType: exercise.equipmentType || exercise.equipment || '',
      movementPattern: exercise.movementPattern || '',
      notes: exercise.notes || '',
      isAiTracked: !!exercise.isAiTracked || isAiTrackedByName(exercise.name),
      isBodyweight: !!exercise.isBodyweight,
      isCustom: !!exercise.isCustom,
      thumbnailUrl: exercise.thumbnailUrl || '',
      demoVideoUrl: exercise.demoVideoUrl || '',
      aiExerciseClass: exercise.aiExerciseClass || '',
      history: await buildExerciseHistory(exercise.id),
    });
  }

  return items;
}

export async function toggleSetCompleted(setId: string) {
  await database.write(async () => {
    const set = await database.collections.get('workout_sets').find(setId) as any;
    const timestamp = now();

    await set.update((record: any) => {
      record.completed = !record.completed;
      record.updatedAt = timestamp;
    });
  });
}

export async function addSetToRoutineExercise(
  sessionId: string,
  routineExerciseId: string,
  setType: 'normal' | 'warmup' | 'failure' | 'drop' = 'normal',
) {
  await database.write(async () => {
    const timestamp = now();
    const routineExercise = await database.collections
      .get('routine_exercises')
      .find(routineExerciseId) as any;
    const setsCollection = database.collections.get('workout_sets');
    const existing = await setsCollection
      .query(
        Q.where('session_id', sessionId),
        Q.where('routine_exercise_id', routineExerciseId),
        isLiveRecordQuery(),
      )
      .fetch();

    const order = existing.length + 1;
    const isWarmup = setType === 'warmup';

    await setsCollection.create((record: any) => {
      record.remoteSetId = '';
      record.sessionId = sessionId;
      record.exerciseId = routineExercise.exerciseId;
      record.routineExerciseId = routineExerciseId;
      record.setOrder = order;
      record.setType = setType;
      record.setNumber = order;
      record.isWarmup = isWarmup;
      record.logMode = 'manual';
      record.previousWeightKg = 0;
      record.previousReps = 0;
      record.weightKg = isWarmup
        ? Math.round((routineExercise.defaultWeightKg || 0) * 0.5)
        : routineExercise.defaultWeightKg || 0;
      record.reps = isWarmup
        ? Math.max(5, Math.floor((routineExercise.targetReps || 10) * 0.5))
        : routineExercise.targetReps || 0;
      record.rpe = isWarmup ? 0 : routineExercise.targetRpe || 0;
      record.restSeconds = routineExercise.defaultRestSeconds || 90;
      record.completed = false;
      record.modelConfidenceAvg = 0;
      record.totalDisplacementM = 0;
      record.notes = '';
      record.deletedAt = 0;
      record.createdAt = timestamp;
      record.updatedAt = timestamp;
    });
  });
}

export async function addExerciseToActiveSession(sessionId: string, routineId: string, exerciseId: string) {
  await database.write(async () => {
    const timestamp = now();
    const routineExercises = database.collections.get('routine_exercises');
    const workoutSets = database.collections.get('workout_sets');
    const existingRoutineExercises = await routineExercises
      .query(Q.where('routine_id', routineId), isLiveRecordQuery())
      .fetch();

    const exercise = await database.collections.get('exercises').find(exerciseId) as any;
    const defaultWeight = exercise.isBodyweight ? 0 : 20;
    const defaultReps = exercise.isBodyweight ? 12 : 10;

    const routineExercise = await routineExercises.create((record: any) => {
      record.remoteRoutineExerciseId = '';
      record.routineId = routineId;
      record.exerciseId = exerciseId;
      record.sortOrder = existingRoutineExercises.length + 1;
      record.targetSets = 3;
      record.targetReps = defaultReps;
      record.targetRepsMin = Math.max(1, defaultReps - 2);
      record.targetRepsMax = defaultReps + 2;
      record.targetRpe = exercise.isBodyweight ? 0 : 8;
      record.defaultWeightKg = defaultWeight;
      record.defaultRestSeconds = 90;
      record.note = '';
      record.focusMetric = exercise.isBodyweight ? 'total_reps' : 'previous';
      record.deletedAt = 0;
      record.createdAt = timestamp;
      record.updatedAt = timestamp;
    }) as any;

    for (let index = 0; index < 3; index += 1) {
      await workoutSets.create((record: any) => {
        record.remoteSetId = '';
        record.sessionId = sessionId;
        record.exerciseId = exerciseId;
        record.routineExerciseId = routineExercise.id;
        record.setOrder = index + 1;
        record.setType = 'normal';
        record.setNumber = index + 1;
        record.isWarmup = false;
        record.logMode = 'manual';
        record.previousWeightKg = 0;
        record.previousReps = 0;
        record.weightKg = defaultWeight;
        record.reps = defaultReps;
        record.rpe = exercise.isBodyweight ? 0 : 8;
        record.restSeconds = 90;
        record.completed = false;
        record.modelConfidenceAvg = 0;
        record.totalDisplacementM = 0;
        record.notes = '';
        record.deletedAt = 0;
        record.createdAt = timestamp;
        record.updatedAt = timestamp;
      });
    }
  });
}

export async function replaceExerciseInActiveWorkout(
  sessionId: string,
  routineExerciseId: string,
  newExerciseId: string,
) {
  await database.write(async () => {
    const timestamp = now();
    const routineExercise = await database.collections
      .get('routine_exercises')
      .find(routineExerciseId) as any;
    const exercise = await database.collections.get('exercises').find(newExerciseId) as any;
    const sets = await database.collections
      .get('workout_sets')
      .query(
        Q.where('session_id', sessionId),
        Q.where('routine_exercise_id', routineExerciseId),
        isLiveRecordQuery(),
      )
      .fetch();

    await routineExercise.update((record: any) => {
      record.exerciseId = newExerciseId;
      record.defaultWeightKg = exercise.isBodyweight ? 0 : record.defaultWeightKg;
      record.targetRpe = exercise.isBodyweight ? 0 : record.targetRpe;
      record.focusMetric = exercise.isBodyweight ? 'total_reps' : record.focusMetric || 'previous';
      record.updatedAt = timestamp;
    });

    for (const set of sets as any[]) {
      await set.update((record: any) => {
        record.exerciseId = newExerciseId;
        record.weightKg = exercise.isBodyweight ? 0 : record.weightKg;
        record.rpe = exercise.isBodyweight ? 0 : record.rpe;
        record.updatedAt = timestamp;
      });
    }
  });
}

export async function removeExerciseFromActiveWorkout(sessionId: string, routineExerciseId: string) {
  await database.write(async () => {
    const timestamp = now();
    const routineExercise = await database.collections
      .get('routine_exercises')
      .find(routineExerciseId) as any;
    const sets = await database.collections
      .get('workout_sets')
      .query(
        Q.where('session_id', sessionId),
        Q.where('routine_exercise_id', routineExerciseId),
        isLiveRecordQuery(),
      )
      .fetch();

    await routineExercise.update((record: any) => {
      record.deletedAt = timestamp;
      record.updatedAt = timestamp;
    });

    for (const set of sets as any[]) {
      await set.update((record: any) => {
        record.deletedAt = timestamp;
        record.updatedAt = timestamp;
      });
    }
  });
}

export async function updateRoutineExerciseNote(routineExerciseId: string, note: string) {
  await database.write(async () => {
    const routineExercise = await database.collections
      .get('routine_exercises')
      .find(routineExerciseId) as any;
    const timestamp = now();

    await routineExercise.update((record: any) => {
      record.note = note;
      record.updatedAt = timestamp;
    });
  });
}

export async function updateRoutineExerciseFocusMetric(
  routineExerciseId: string,
  focusMetric: FocusMetric,
) {
  await database.write(async () => {
    const routineExercise = await database.collections
      .get('routine_exercises')
      .find(routineExerciseId) as any;
    const timestamp = now();

    await routineExercise.update((record: any) => {
      record.focusMetric = focusMetric;
      record.updatedAt = timestamp;
    });
  });
}

export async function updateRoutineExerciseRestTimer(
  sessionId: string,
  routineExerciseId: string,
  restSeconds: number,
) {
  await database.write(async () => {
    const timestamp = now();
    const routineExercise = await database.collections
      .get('routine_exercises')
      .find(routineExerciseId) as any;
    const sets = await database.collections
      .get('workout_sets')
      .query(
        Q.where('session_id', sessionId),
        Q.where('routine_exercise_id', routineExerciseId),
        isLiveRecordQuery(),
      )
      .fetch();

    await routineExercise.update((record: any) => {
      record.defaultRestSeconds = restSeconds;
      record.updatedAt = timestamp;
    });

    for (const set of sets as any[]) {
      await set.update((record: any) => {
        record.restSeconds = restSeconds;
        record.updatedAt = timestamp;
      });
    }
  });
}

export async function finishActiveWorkout(sessionId: string) {
  await database.write(async () => {
    const session = await database.collections.get('sessions').find(sessionId) as any;
    const sets = await database.collections
      .get('workout_sets')
      .query(Q.where('session_id', sessionId), isLiveRecordQuery())
      .fetch();
    const timestamp = now();

    const totalReps = (sets as any[]).reduce(
      (sum, set) => sum + (set.completed ? Number(set.reps || 0) : 0),
      0,
    );

    await session.update((record: any) => {
      record.status = 'completed';
      record.endedAt = timestamp;
      record.totalReps = totalReps;
      record.totalDurationSeconds = secondsSince(record.startedAt);
      record.updatedAt = timestamp;
    });
  });
}

export async function cancelActiveWorkout(sessionId: string) {
  await database.write(async () => {
    const session = await database.collections.get('sessions').find(sessionId) as any;
    const sets = await database.collections
      .get('workout_sets')
      .query(Q.where('session_id', sessionId), isLiveRecordQuery())
      .fetch();
    const timestamp = now();

    await session.update((record: any) => {
      record.status = 'cancelled';
      record.endedAt = timestamp;
      record.deletedAt = timestamp;
      record.updatedAt = timestamp;
    });

    for (const set of sets as any[]) {
      await set.update((record: any) => {
        record.deletedAt = timestamp;
        record.updatedAt = timestamp;
      });
    }
  });
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
