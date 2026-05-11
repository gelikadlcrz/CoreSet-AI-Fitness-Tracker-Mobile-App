import { Q } from '@nozbe/watermelondb';

import { database } from '../sqlite';

import { Rep } from '../models/Rep';

class RepRepository {
  private collection = database.collections.get<Rep>('reps');

  async getBySet(setId: string): Promise<Rep[]> {
    return await this.collection
      .query(Q.where('set_id', setId))
      .fetch();
  }
}

export const repRepository = new RepRepository();