import { database } from '../../database';

import { API_BASE_URL } from '../api';

export async function pullExercises() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/exercises`
    );

    const exercises =
      await response.json();

    await database.write(
      async () => {
        const collection =
          database.collections.get(
            'exercises'
          );

        const existing =
          await collection.query().fetch();

        for (const item of existing) {
          await item.destroyPermanently();
        }

        for (const exercise of exercises) {
          await collection.create(
            (record: any) => {
              record.exerciseId =
                exercise.id;

              record.name =
                exercise.name;

              record.muscleGroup =
                exercise.muscle_group;

              record.equipment =
                exercise.equipment || '';

              record.notes =
                exercise.notes || '';
            }
          );
        }
      }
    );

    console.log(
      'Exercises synced successfully'
    );
  } catch (error) {
    console.log(
      'SYNC ERROR',
      error
    );
  }
}