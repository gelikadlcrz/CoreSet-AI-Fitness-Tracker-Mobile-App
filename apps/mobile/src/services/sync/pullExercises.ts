import { Q } from '@nozbe/watermelondb';

import { database } from '../../database';
import { API_BASE_URL } from '../api';

export async function pullExercises() {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises`);
    const exercises = await response.json();
    const timestamp = Date.now();

    await database.write(async () => {
      const collection = database.collections.get('exercises');

      for (const exercise of exercises) {
        const externalId = String(exercise.id ?? exercise.exercise_id ?? exercise.name);
        const existing = await collection.query(Q.where('exercise_id', externalId)).fetch();

        if (existing[0]) {
          await (existing[0] as any).update((record: any) => {
            record.name = exercise.name;
            record.muscleGroup = exercise.muscle_group || exercise.muscleGroup || 'General';
            record.equipment = exercise.equipment || '';
            record.notes = exercise.notes || '';
            record.updatedAt = timestamp;
          });
        } else {
          await collection.create((record: any) => {
            record.exerciseId = externalId;
            record.name = exercise.name;
            record.muscleGroup = exercise.muscle_group || exercise.muscleGroup || 'General';
            record.equipment = exercise.equipment || '';
            record.notes = exercise.notes || '';
            record.createdAt = timestamp;
            record.updatedAt = timestamp;
          });
        }
      }
    });

    console.log('Exercises synced successfully');
  } catch (error) {
    console.log('SYNC ERROR', error);
  }
}
