import { Q } from '@nozbe/watermelondb';

import { database } from '../sqlite';

import { Exercise } from '../models/Exercise';

class ExerciseRepository {
  private collection = database.collections.get<Exercise>('exercises');

  async getAll(): Promise<Exercise[]> {
    return await this.collection.query().fetch();
  }

  async searchByName(query: string): Promise<Exercise[]> {
    return await this.collection
      .query(Q.where('name', Q.like(`%${query}%`)))
      .fetch();
  }
}

export const exerciseRepository = new ExerciseRepository();