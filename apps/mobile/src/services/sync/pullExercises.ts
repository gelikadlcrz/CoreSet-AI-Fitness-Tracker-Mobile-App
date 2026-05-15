import { Q } from '@nozbe/watermelondb';

import { database } from '../../database';
import { API_BASE_URL } from '../api';

function toTimestamp(value: unknown) {
  if (!value) return Date.now();
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeSecondaryMuscles(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export async function pullExercises() {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises`);
    const exercises = await response.json();
    const timestamp = Date.now();

    await database.write(async () => {
      const collection = database.collections.get('exercises');

      for (const exercise of exercises) {
        const externalId = String(exercise.exercise_id ?? exercise.id ?? exercise.name);
        const primaryMuscle = exercise.primary_muscle ?? exercise.muscle_group ?? exercise.primaryMuscle ?? 'General';
        const equipmentType = exercise.equipment_type ?? exercise.equipment ?? exercise.equipmentType ?? '';
        const existing = await collection.query(Q.where('exercise_id', externalId)).fetch();

        const assign = (record: any) => {
          record.exerciseId = externalId;
          record.name = exercise.name;
          record.muscleGroup = primaryMuscle;
          record.equipment = equipmentType;
          record.notes = exercise.default_notes ?? exercise.notes ?? '';
          record.primaryMuscle = primaryMuscle;
          record.secondaryMusclesJson = normalizeSecondaryMuscles(exercise.secondary_muscles ?? exercise.secondaryMuscles);
          record.equipmentType = equipmentType;
          record.movementPattern = exercise.movement_pattern ?? exercise.movementPattern ?? '';
          record.isAiTracked = !!(exercise.is_ai_tracked ?? exercise.isAiTracked);
          record.aiExerciseClass = exercise.ai_exercise_class ?? exercise.aiExerciseClass ?? '';
          record.isBodyweight = !!(exercise.is_bodyweight ?? exercise.isBodyweight);
          record.isCustom = !!(exercise.is_custom ?? exercise.isCustom);
          record.thumbnailUrl = exercise.thumbnail_url ?? exercise.thumbnailUrl ?? '';
          record.demoVideoUrl = exercise.demo_video_url ?? exercise.demoVideoUrl ?? '';
          record.remoteCreatedByUser = exercise.created_by_user ?? exercise.createdByUser ?? '';
          record.deletedAt = exercise.deleted_at ? toTimestamp(exercise.deleted_at) : 0;
          record.updatedAt = toTimestamp(exercise.updated_at ?? exercise.updatedAt ?? timestamp);
        };

        if (existing[0]) {
          await (existing[0] as any).update(assign);
        } else {
          await collection.create((record: any) => {
            assign(record);
            record.createdAt = toTimestamp(exercise.created_at ?? exercise.createdAt ?? timestamp);
          });
        }
      }
    });

    console.log('Exercises synced successfully');
  } catch (error) {
    console.log('SYNC ERROR', error);
  }
}
