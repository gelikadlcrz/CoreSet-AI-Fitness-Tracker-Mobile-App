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

function normalizeInstructions(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function firstInstruction(value: unknown) {
  if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean)[0] || '';
  if (typeof value === 'string') return value;
  return '';
}

export async function pullExercises() {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises`);
    const exercises = await response.json();
    const timestamp = Date.now();

    await database.write(async () => {
      const collection = database.collections.get('exercises');

      for (const exercise of exercises) {
        const externalId = String(exercise.exercise_id ?? exercise.id ?? exercise.exercise_db_id ?? exercise.name);
        const targetMuscle = exercise.target_muscle ?? exercise.primary_muscle ?? exercise.muscle_group ?? exercise.primaryMuscle ?? 'General';
        const bodyPart = exercise.body_part ?? exercise.bodyPart ?? '';
        const primaryMuscle = targetMuscle || bodyPart || 'General';
        const equipmentType = exercise.equipment_type ?? exercise.equipment ?? exercise.equipmentType ?? '';
        const description = exercise.description ?? exercise.default_notes ?? exercise.notes ?? firstInstruction(exercise.instructions) ?? '';
        const thumbnailUrl = exercise.thumbnail_url ?? exercise.thumbnailUrl ?? exercise.image_url ?? exercise.imageUrl ?? exercise.gif_url ?? exercise.gifUrl ?? '';
        const existing = await collection.query(Q.where('exercise_id', externalId)).fetch();

        const assign = (record: any) => {
          record.exerciseId = externalId;
          record.exerciseDbId = exercise.exercise_db_id ?? exercise.exerciseDbId ?? '';
          record.name = exercise.name;
          record.bodyPart = bodyPart;
          record.targetMuscle = targetMuscle;
          record.muscleGroup = primaryMuscle;
          record.equipment = equipmentType;
          record.notes = exercise.default_notes ?? exercise.notes ?? description ?? '';
          record.description = description;
          record.instructionsJson = normalizeInstructions(exercise.instructions ?? exercise.instructions_json ?? exercise.instructionsJson);
          record.imageUrl = exercise.image_url ?? exercise.imageUrl ?? '';
          record.gifUrl = exercise.gif_url ?? exercise.gifUrl ?? '';
          record.primaryMuscle = primaryMuscle;
          record.secondaryMusclesJson = normalizeSecondaryMuscles(exercise.secondary_muscles ?? exercise.secondaryMuscles);
          record.equipmentType = equipmentType;
          record.movementPattern = exercise.movement_pattern ?? exercise.movementPattern ?? bodyPart ?? '';
          record.isAiTracked = !!(exercise.is_ai_tracked ?? exercise.isAiTracked);
          record.aiExerciseClass = exercise.ai_exercise_class ?? exercise.aiExerciseClass ?? '';
          record.isBodyweight = !!(exercise.is_bodyweight ?? exercise.isBodyweight ?? String(equipmentType).toLowerCase().includes('body weight'));
          record.isCustom = !!(exercise.is_custom ?? exercise.isCustom);
          record.thumbnailUrl = thumbnailUrl;
          record.demoVideoUrl = exercise.demo_video_url ?? exercise.demoVideoUrl ?? exercise.gif_url ?? exercise.gifUrl ?? '';
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
