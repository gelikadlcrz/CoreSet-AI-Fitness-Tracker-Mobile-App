import { Q } from '@nozbe/watermelondb';

import { database } from '../sqlite';

import { WorkoutSet } from '../models/WorkoutSet';

class WorkoutSetRepository {
  private collection =
    database.collections.get<WorkoutSet>('sets');

  async getBySession(
    sessionId: string,
  ): Promise<WorkoutSet[]> {
    return await this.collection
      .query(Q.where('session_id', sessionId))
      .fetch();
  }
}

export const workoutSetRepository =
  new WorkoutSetRepository();