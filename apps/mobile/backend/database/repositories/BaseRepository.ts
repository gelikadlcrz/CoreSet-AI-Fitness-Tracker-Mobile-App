import { Model } from '@nozbe/watermelondb';

import { database } from '../sqlite';

export abstract class BaseRepository<T extends Model> {
  protected collection;

  constructor(tableName: string) {
    this.collection = database.collections.get<T>(tableName);
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await this.collection.find(id);
    } catch {
      return null;
    }
  }

  async getAll(): Promise<T[]> {
    return await this.collection.query().fetch();
  }
}