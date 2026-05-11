import { Q } from '@nozbe/watermelondb';

import { database } from '../sqlite';

import { Session } from '../models/Session';

class SessionRepository {
  private collection =
    database.collections.get<Session>('sessions');

  async getAll(): Promise<Session[]> {
    return await this.collection.query().fetch();
  }

  async getByUser(userId: string): Promise<Session[]> {
    return await this.collection
      .query(Q.where('user_id', userId))
      .fetch();
  }
}

export const sessionRepository =
  new SessionRepository();