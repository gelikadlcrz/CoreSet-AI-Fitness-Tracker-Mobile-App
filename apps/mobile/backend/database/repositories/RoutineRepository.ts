import { Q } from '@nozbe/watermelondb';

import { database } from '../sqlite';

import { Routine } from '../models/Routine';

class RoutineRepository {
  private collection = database.collections.get<Routine>('routines');

  async getAll(): Promise<Routine[]> {
    return await this.collection.query().fetch();
  }

  async getByUser(userId: string): Promise<Routine[]> {
    return await this.collection
      .query(Q.where('user_id', userId))
      .fetch();
  }
}

export const routineRepository = new RoutineRepository();