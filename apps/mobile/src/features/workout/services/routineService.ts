import { Q } from '@nozbe/watermelondb';

import { database } from '../../../database';

export type RoutineExerciseInput = {
  id?: string;
  exerciseId: string;
  sortOrder?: number;
  targetSets?: number;
  targetReps?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetRpe?: number;
  defaultWeightKg?: number;
  defaultRestSeconds?: number;
  note?: string;
};

export type RoutineInput = {
  name: string;
  notes?: string;
  remoteUserId?: string;
  exercises?: RoutineExerciseInput[];
};

const now = () => Date.now();

export async function getRoutines() {
  const routines = await database.collections
    .get('routines')
    .query(Q.or(Q.where('deleted_at', Q.eq(null)), Q.where('deleted_at', 0)))
    .fetch();

  return routines as any[];
}

export async function getRoutineExercises(routineId: string) {
  const items = await database.collections
    .get('routine_exercises')
    .query(
      Q.where('routine_id', routineId),
      Q.or(Q.where('deleted_at', Q.eq(null)), Q.where('deleted_at', 0)),
      Q.sortBy('sort_order', Q.asc),
    )
    .fetch();

  return items as any[];
}

export async function createRoutine(input: RoutineInput) {
  let createdRoutine: any;

  await database.write(async () => {
    const timestamp = now();
    const routines = database.collections.get('routines');
    const routineExercises = database.collections.get('routine_exercises');

    createdRoutine = await routines.create((record: any) => {
      record.remoteRoutineId = '';
      record.remoteUserId = input.remoteUserId || 'local-demo-user';
      record.name = input.name;
      record.notes = input.notes || '';
      record.lastUsedAt = 0;
      record.deletedAt = 0;
      record.createdAt = timestamp;
      record.updatedAt = timestamp;
    });

    for (const [index, item] of (input.exercises || []).entries()) {
      await routineExercises.create((record: any) => {
        record.remoteRoutineExerciseId = '';
        record.routineId = createdRoutine.id;
        record.exerciseId = item.exerciseId;
        record.sortOrder = item.sortOrder ?? index + 1;
        record.targetSets = item.targetSets ?? 3;
        record.targetReps = item.targetReps ?? item.targetRepsMax ?? 10;
        record.targetRepsMin = item.targetRepsMin ?? item.targetReps ?? 8;
        record.targetRepsMax = item.targetRepsMax ?? item.targetReps ?? 12;
        record.targetRpe = item.targetRpe ?? 8;
        record.defaultWeightKg = item.defaultWeightKg ?? 0;
        record.defaultRestSeconds = item.defaultRestSeconds ?? 90;
        record.note = item.note || '';
        record.deletedAt = 0;
        record.createdAt = timestamp;
        record.updatedAt = timestamp;
      });
    }
  });

  return createdRoutine;
}

export async function updateRoutine(routineId: string, input: Partial<RoutineInput>) {
  await database.write(async () => {
    const routine = await database.collections.get('routines').find(routineId);
    const timestamp = now();

    await (routine as any).update((record: any) => {
      if (input.name !== undefined) record.name = input.name;
      if (input.notes !== undefined) record.notes = input.notes || '';
      if (input.remoteUserId !== undefined) record.remoteUserId = input.remoteUserId || '';
      record.updatedAt = timestamp;
    });
  });
}

export async function addExerciseToRoutine(routineId: string, input: RoutineExerciseInput) {
  let created: any;

  await database.write(async () => {
    const timestamp = now();
    const collection = database.collections.get('routine_exercises');
    const existing = await getRoutineExercises(routineId);

    created = await collection.create((record: any) => {
      record.remoteRoutineExerciseId = '';
      record.routineId = routineId;
      record.exerciseId = input.exerciseId;
      record.sortOrder = input.sortOrder ?? existing.length + 1;
      record.targetSets = input.targetSets ?? 3;
      record.targetReps = input.targetReps ?? input.targetRepsMax ?? 10;
      record.targetRepsMin = input.targetRepsMin ?? input.targetReps ?? 8;
      record.targetRepsMax = input.targetRepsMax ?? input.targetReps ?? 12;
      record.targetRpe = input.targetRpe ?? 8;
      record.defaultWeightKg = input.defaultWeightKg ?? 0;
      record.defaultRestSeconds = input.defaultRestSeconds ?? 90;
      record.note = input.note || '';
      record.deletedAt = 0;
      record.createdAt = timestamp;
      record.updatedAt = timestamp;
    });
  });

  return created;
}

export async function updateRoutineExercise(routineExerciseId: string, input: Partial<RoutineExerciseInput>) {
  await database.write(async () => {
    const record = await database.collections.get('routine_exercises').find(routineExerciseId);
    const timestamp = now();

    await (record as any).update((item: any) => {
      if (input.exerciseId !== undefined) item.exerciseId = input.exerciseId;
      if (input.sortOrder !== undefined) item.sortOrder = input.sortOrder;
      if (input.targetSets !== undefined) item.targetSets = input.targetSets;
      if (input.targetReps !== undefined) item.targetReps = input.targetReps;
      if (input.targetRepsMin !== undefined) item.targetRepsMin = input.targetRepsMin;
      if (input.targetRepsMax !== undefined) item.targetRepsMax = input.targetRepsMax;
      if (input.targetRpe !== undefined) item.targetRpe = input.targetRpe;
      if (input.defaultWeightKg !== undefined) item.defaultWeightKg = input.defaultWeightKg;
      if (input.defaultRestSeconds !== undefined) item.defaultRestSeconds = input.defaultRestSeconds;
      if (input.note !== undefined) item.note = input.note || '';
      item.updatedAt = timestamp;
    });
  });
}

export async function removeExerciseFromRoutine(routineExerciseId: string) {
  await database.write(async () => {
    const record = await database.collections.get('routine_exercises').find(routineExerciseId);
    const timestamp = now();

    await (record as any).update((item: any) => {
      item.deletedAt = timestamp;
      item.updatedAt = timestamp;
    });
  });
}

export async function deleteRoutine(routineId: string) {
  await database.write(async () => {
    const timestamp = now();
    const routine = await database.collections.get('routines').find(routineId);
    const routineExercises = await getRoutineExercises(routineId);

    await (routine as any).update((record: any) => {
      record.deletedAt = timestamp;
      record.updatedAt = timestamp;
    });

    for (const item of routineExercises) {
      await item.update((record: any) => {
        record.deletedAt = timestamp;
        record.updatedAt = timestamp;
      });
    }
  });
}
