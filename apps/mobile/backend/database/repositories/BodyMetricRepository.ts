import { Q } from '@nozbe/watermelondb';

import { database } from '../sqlite';

import { BodyMetric } from '../models/BodyMetric';

class BodyMetricRepository {
  private collection =
    database.collections.get<BodyMetric>('body_metrics');

  async getByUser(userId: string): Promise<BodyMetric[]> {
    return await this.collection
      .query(Q.where('user_id', userId))
      .fetch();
  }
}

export const bodyMetricRepository =
  new BodyMetricRepository();